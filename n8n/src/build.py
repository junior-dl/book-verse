"""Builds the n8n Workflow SDK files from the plain JS sources in this folder.

Run:  python3 n8n/src/build.py   (writes n8n/*.workflow.ts)
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
CRED = "{ postgres: newCredential('BookVerse Neon (catalog-v2)') }"


def src(name):
    with open(os.path.join(HERE, name)) as f:
        return f.read()


COMMON = src("common.js")


def code(name):
    return json.dumps(COMMON + "\n" + src(name))


UA = "BookVerse/1.0 ({{ $('Config').first().json.contactEmail }})"


def http(var, name, url, sample, timeout=20000):
    return f"""const {var} = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {{
    name: '{name}',
    onError: 'continueRegularOutput',
    parameters: {{
      url: expr({json.dumps(url)}),
      sendHeaders: true,
      headerParameters: {{ parameters: [
        {{ name: 'User-Agent', value: expr({json.dumps(UA)}) }},
        {{ name: 'Accept', value: 'application/json' }}
      ] }},
      options: {{ timeout: {timeout} }}
    }}
  }},
  output: [{json.dumps(sample)}]
}});
"""


def pg(var, name, query, sample, extra=""):
    return f"""const {var} = node({{
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {{
    name: '{name}',{extra}
    parameters: {{ operation: 'executeQuery', query: {json.dumps(query)}, options: {{}} }},
    credentials: {CRED}
  }},
  output: [{json.dumps(sample)}]
}});
"""


def cond(key):
    return ("{ outputKey: '%s', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, "
            "conditions: [{ leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: '%s' }], "
            "combinator: 'and' } }") % (key, key)


Q = "{{ encodeURIComponent($('Loop Jobs').first().json.payload.q) }}"

SEED = """WITH dead AS (
  DELETE FROM ingest_queue WHERE attempts >= 4 AND created_at < now() - interval '7 days' RETURNING 1
),
idle AS (SELECT NOT EXISTS (SELECT 1 FROM ingest_queue WHERE not_before <= now() AND attempts < 4) AS yes),
cur AS (
  INSERT INTO api_budget (day, service, calls) VALUES ('2000-01-01', 'gutendex_cursor', 1)
  ON CONFLICT (day, service) DO UPDATE SET calls = api_budget.calls + CASE WHEN (SELECT yes FROM idle) THEN 1 ELSE 0 END
  RETURNING calls
),
seeded AS (
  INSERT INTO ingest_queue (kind, key, payload, priority)
  SELECT 'discover', 'discover:gutendex:' || calls, jsonb_build_object('page', calls), 9
  FROM cur WHERE (SELECT yes FROM idle) AND calls BETWEEN 1 AND {{ $json.maxDiscoverPages }}
  ON CONFLICT DO NOTHING
  RETURNING 1
)
SELECT (SELECT count(*) FROM seeded)::int AS seeded, (SELECT count(*) FROM dead)::int AS cleaned;"""

UPDATE_AUTHOR = """WITH x AS (SELECT $bv${{ $json.update }}$bv$::jsonb AS j),
u AS (
  UPDATE authors a SET
    bio = coalesce(a.bio, x.j ->> 'bio'),
    photo_url = coalesce(a.photo_url, nullif(x.j ->> 'photoUrl', '')),
    ol_key = CASE WHEN a.ol_key IS NULL AND NOT EXISTS (SELECT 1 FROM authors o WHERE o.ol_key = x.j ->> 'olKey') THEN nullif(x.j ->> 'olKey', '') ELSE a.ol_key END,
    birth_year = coalesce(a.birth_year, nullif(x.j ->> 'birthYear', '')::smallint),
    death_year = coalesce(a.death_year, nullif(x.j ->> 'deathYear', '')::smallint),
    enrich_level = greatest(a.enrich_level, 1),
    updated_at = now()
  FROM x WHERE a.id = (x.j ->> 'authorId')::uuid
  RETURNING 1
)
SELECT count(*)::int AS updated FROM u;"""

ingest = "// @ts-nocheck — n8n Workflow SDK source, parsed by n8n (not part of the Nuxt build)\nimport { workflow, node, trigger, sticky, placeholder, newCredential, splitInBatches, nextBatch, switchCase, expr } from '@n8n/workflow-sdk';\n\n"
ingest += """const schedule = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: { name: 'Every 20 Minutes', parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 20 }] } } },
  output: [{}]
});

const config = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Config',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [
        { id: 'jobs', name: 'jobsPerRun', value: 3, type: 'number' },
        { id: 'email', name: 'contactEmail', value: '+https://github.com/junior-dl/book-verse', type: 'string' },
        { id: 'pages', name: 'maxDiscoverPages', value: 2000, type: 'number' }
      ] }
    }
  },
  output: [{ jobsPerRun: 3, contactEmail: 'you@example.com', maxDiscoverPages: 2000 }]
});

"""
ingest += pg("seedDiscovery", "Seed Discovery Job", SEED, {"ok": 1})
ingest += pg("claimJobs", "Claim Jobs",
             "SELECT id, kind, key, payload FROM bv_claim_jobs(NULL, {{ $('Config').first().json.jobsPerRun }});",
             {"id": 1, "kind": "search", "key": "search:dune", "payload": {"q": "dune"}}, "\n    executeOnce: true,")
ingest += """
const loopJobs = splitInBatches({ version: 3, config: { name: 'Loop Jobs', parameters: { batchSize: 1, options: {} } } });

const routeJob = switchCase({
  version: 3.2,
  config: {
    name: 'Route by Job Kind',
    parameters: {
      rules: { values: [
        %s,
        %s,
        %s
      ] },
      options: { fallbackOutput: 'extra', renameFallbackOutput: 'Unknown' }
    }
  }
});

""" % (cond("search"), cond("discover"), cond("author"))
ingest += http("gutendexSearch", "Gutendex Search", "https://gutendex.com/books?search=" + Q, {"count": 1, "results": []}, 30000)
ingest += http("openLibrarySearch", "Open Library Search",
               "https://openlibrary.org/search.json?limit=6&fields=key,title,subtitle,author_name,author_key,first_publish_year,isbn,subject,language,cover_i,ia,ebook_access,want_to_read_count,ratings_count&q=" + Q,
               {"numFound": 0, "docs": []})
ingest += http("googleBooksSearch", "Google Books Search",
               "https://www.googleapis.com/books/v1/volumes?maxResults=6&printType=books&q=" + Q, {"totalItems": 0, "items": []})
ingest += http("crossRefLookup", "CrossRef Lookup",
               "https://api.crossref.org/works?rows=3&select=DOI,title,type{{ String($('Config').first().json.contactEmail).includes('@') ? '&mailto=' + encodeURIComponent($('Config').first().json.contactEmail) : '' }}&query.bibliographic=" + Q,
               {"message": {"items": []}})
ingest += http("gutendexPage", "Gutendex Page", "https://gutendex.com/books?page={{ $('Loop Jobs').first().json.payload.page }}",
               {"count": 1, "results": []}, 30000)
ingest += http("openLibraryAuthor", "Open Library Author",
               "https://openlibrary.org/search/authors.json?limit=3&q={{ encodeURIComponent($('Loop Jobs').first().json.payload.name) }}", {"docs": []})
ingest += http("wikipediaSummary", "Wikipedia Summary",
               "https://en.wikipedia.org/api/rest_v1/page/summary/{{ encodeURIComponent(String($('Loop Jobs').first().json.payload.name).replace(/ /g, '_')) }}",
               {"type": "standard", "extract": ""})

for var, name, f, sample in [
    ("normalizeSearch", "Normalize Search Results", "normalize_search.js", "{ docs: '[]', count: 0 }"),
    ("normalizeDiscover", "Normalize Gutendex Page", "normalize_discover.js", "{ docs: '[]', count: 0 }"),
    ("buildAuthor", "Build Author Update", "author_update.js", "{ update: '{}' }"),
]:
    ingest += f"""const {var} = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{ name: '{name}', parameters: {{ mode: 'runOnceForAllItems', jsCode: {code(f)} }} }},
  output: [{sample}]
}});

"""

ingest += pg("ingestDocs", "Ingest Books",
             "SELECT count(bv_ingest_work(d))::int AS ingested FROM jsonb_array_elements($bv${{ $json.docs }}$bv$::jsonb) AS d;",
             {"ingested": 3}, "\n    onError: 'continueRegularOutput',")
ingest += pg("updateAuthor", "Update Author", UPDATE_AUTHOR, {"updated": 1}, "\n    onError: 'continueRegularOutput',")
ingest += pg("finishJob", "Finish Job",
             "WITH d AS (DELETE FROM ingest_queue WHERE id = {{ $('Loop Jobs').first().json.id }} AND {{ !$json.error }} RETURNING 1) SELECT count(*)::int AS finished FROM d;",
             {"finished": 1})
ingest += """const politeDelay = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Polite Delay', parameters: { resume: 'timeInterval', amount: 4, unit: 'seconds' } },
  output: [{ finished: 1 }]
});

const note = sticky('## BookVerse catalog ingest\\nEvery 20 min this claims up to 3 jobs from the Neon `ingest_queue`: searches with few results, author pages without a bio, or (when idle) the next page of popular Gutendex books.\\n\\nProviders: Gutendex, Open Library, Google Books, CrossRef (DOI only) and Wikipedia (author bios). All matching and de-duplication happens in Postgres (`bv_ingest_work`), so nothing is stored in n8n.', [], { color: 4, width: 560, height: 260 });

export default workflow('bookverse-ingest', 'BookVerse – Catalog Ingest')
  .add(schedule)
  .to(config)
  .to(seedDiscovery)
  .to(claimJobs)
  .to(loopJobs
    .onEachBatch(routeJob
      .onCase(0, gutendexSearch.to(openLibrarySearch).to(googleBooksSearch).to(crossRefLookup).to(normalizeSearch).to(ingestDocs))
      .onCase(1, gutendexPage.to(normalizeDiscover).to(ingestDocs))
      .onCase(2, openLibraryAuthor.to(wikipediaSummary).to(buildAuthor).to(updateAuthor))
      .onCase(3, finishJob)))
  .add(ingestDocs)
  .to(finishJob)
  .add(updateAuthor)
  .to(finishJob)
  .add(finishJob)
  .to(politeDelay)
  .to(nextBatch(loopJobs))
  .add(note)
  .group('Search providers', [gutendexSearch, openLibrarySearch, googleBooksSearch, crossRefLookup, normalizeSearch], { description: 'Looks the query up in Gutendex, Open Library, Google Books and CrossRef, then normalizes it all into one shape' })
  .group('Author enrichment', [openLibraryAuthor, wikipediaSummary, buildAuthor], { description: 'Open Library for identity and dates, Wikipedia for a short bio and photo' });
"""

with open(os.path.join(OUT, "ingest.workflow.ts"), "w") as f:
    f.write(ingest)
print("ingest", len(ingest))


# ---------------------------------------------------------------- Gemini tidy workflow
def code_plain(name):
    return json.dumps(src(name))


PENDING = """WITH p AS (
  SELECT alias_norm FROM subject_aliases WHERE decided_by = 'pending'
  ORDER BY alias_norm LIMIT {{ $json.aliasesPerCall }}
)
SELECT json_agg(alias_norm) AS aliases, (SELECT json_agg(slug ORDER BY sort_order) FROM subjects) AS subjects
FROM p
HAVING CASE WHEN count(*) > 0 THEN bv_take_budget('gemini', {{ $json.geminiDailyLimit }}) ELSE false END;"""

gem = "// @ts-nocheck — n8n Workflow SDK source, parsed by n8n (not part of the Nuxt build)\nimport { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';\n\n"
gem += """const hourly = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: { name: 'Every Hour', parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 1, triggerAtMinute: 17 }] } } },
  output: [{}]
});

const config = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Config',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [
        { id: 'model', name: 'model', value: 'gemini-flash-lite-latest', type: 'string' },
        { id: 'limit', name: 'geminiDailyLimit', value: 40, type: 'number' },
        { id: 'batch', name: 'aliasesPerCall', value: 60, type: 'number' }
      ] }
    }
  },
  output: [{ model: 'gemini-flash-lite-latest', geminiDailyLimit: 40, aliasesPerCall: 60 }]
});

"""
gem += pg("pending", "Get Pending Subjects", PENDING, {"aliases": ["whaling fiction"], "subjects": ["fiction", "adventure"]})
gem += f"""const buildRequest = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{ name: 'Build Gemini Request', parameters: {{ mode: 'runOnceForAllItems', jsCode: {code_plain('gemini_request.js')} }} }},
  output: [{{ body: {{}}, aliases: [], subjects: [] }}]
}});

const callGemini = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {{
    name: 'Classify with Gemini',
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 5000,
    parameters: {{
      method: 'POST',
      url: expr("https://generativelanguage.googleapis.com/v1beta/models/{{{{ $('Config').first().json.model }}}}:generateContent"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{{{ JSON.stringify($json.body) }}}}'),
      options: {{ timeout: 60000 }}
    }},
    credentials: {{ googlePalmApi: newCredential('BookVerse – Gemini API') }}
  }},
  output: [{{ candidates: [{{ content: {{ parts: [{{ text: '[]' }}] }} }}] }}]
}});

const parse = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{ name: 'Parse Classifications', parameters: {{ mode: 'runOnceForAllItems', jsCode: {code_plain('gemini_parse.js')} }} }},
  output: [{{ items: '[]', count: 0 }}]
}});

"""
gem += pg("apply", "Apply to Catalog",
          "SELECT bv_apply_subject_aliases($bv${{ $json.items }}$bv$::jsonb) AS classified;", {"classified": 60})
gem += """const note = sticky('## BookVerse AI tidy (Gemini)\\nOnce an hour, sends up to 60 unclassified provider subject headings to Gemini in ONE request and maps them onto the 24 BookVerse subjects.\\n\\nFree-tier safe: `bv_take_budget` stops at `geminiDailyLimit` calls/day (counted in Neon, resets at midnight Pacific). Runs with nothing pending cost nothing.', [], { color: 5, width: 520, height: 240 });

export default workflow('bookverse-gemini', 'BookVerse – AI Tidy (Gemini)')
  .add(hourly)
  .to(config)
  .to(pending)
  .to(buildRequest)
  .to(callGemini)
  .to(parse)
  .to(apply)
  .add(note)
  .group('Gemini classification', [buildRequest, callGemini, parse], { description: 'Builds one structured-output prompt, calls Gemini, and keeps only answers that match the allowed subject list' });
"""

with open(os.path.join(OUT, "gemini.workflow.ts"), "w") as f:
    f.write(gem)
print("gemini", len(gem))
