// @ts-nocheck — n8n Workflow SDK source, parsed by n8n (not part of the Nuxt build)
import { workflow, node, trigger, sticky, placeholder, newCredential, splitInBatches, nextBatch, switchCase, expr } from '@n8n/workflow-sdk';

const schedule = trigger({
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

const seedDiscovery = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Seed Discovery Job',
    parameters: { operation: 'executeQuery', query: "WITH dead AS (\n  DELETE FROM ingest_queue WHERE attempts >= 4 AND created_at < now() - interval '7 days' RETURNING 1\n),\nidle AS (SELECT NOT EXISTS (SELECT 1 FROM ingest_queue WHERE not_before <= now() AND attempts < 4) AS yes),\ncur AS (\n  INSERT INTO api_budget (day, service, calls) VALUES ('2000-01-01', 'gutendex_cursor', 1)\n  ON CONFLICT (day, service) DO UPDATE SET calls = api_budget.calls + CASE WHEN (SELECT yes FROM idle) THEN 1 ELSE 0 END\n  RETURNING calls\n),\nseeded AS (\n  INSERT INTO ingest_queue (kind, key, payload, priority)\n  SELECT 'discover', 'discover:gutendex:' || calls, jsonb_build_object('page', calls), 9\n  FROM cur WHERE (SELECT yes FROM idle) AND calls BETWEEN 1 AND {{ $json.maxDiscoverPages }}\n  ON CONFLICT DO NOTHING\n  RETURNING 1\n)\nSELECT (SELECT count(*) FROM seeded)::int AS seeded, (SELECT count(*) FROM dead)::int AS cleaned;", options: {} },
    credentials: { postgres: newCredential('BookVerse Neon (catalog-v2)') }
  },
  output: [{"ok": 1}]
});
const claimJobs = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Claim Jobs',
    executeOnce: true,
    parameters: { operation: 'executeQuery', query: "SELECT id, kind, key, payload FROM bv_claim_jobs(NULL, {{ $('Config').first().json.jobsPerRun }});", options: {} },
    credentials: { postgres: newCredential('BookVerse Neon (catalog-v2)') }
  },
  output: [{"id": 1, "kind": "search", "key": "search:dune", "payload": {"q": "dune"}}]
});

const loopJobs = splitInBatches({ version: 3, config: { name: 'Loop Jobs', parameters: { batchSize: 1, options: {} } } });

const routeJob = switchCase({
  version: 3.2,
  config: {
    name: 'Route by Job Kind',
    parameters: {
      rules: { values: [
        { outputKey: 'search', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'search' }], combinator: 'and' } },
        { outputKey: 'discover', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'discover' }], combinator: 'and' } },
        { outputKey: 'author', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'author' }], combinator: 'and' } }
      ] },
      options: { fallbackOutput: 'extra', renameFallbackOutput: 'Unknown' }
    }
  }
});

const gutendexSearch = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'Gutendex Search',
    onError: 'continueRegularOutput',
    parameters: {
      url: expr("https://gutendex.com/books?search={{ encodeURIComponent($('Loop Jobs').first().json.payload.q) }}"),
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'User-Agent', value: expr("BookVerse/1.0 ({{ $('Config').first().json.contactEmail }})") },
        { name: 'Accept', value: 'application/json' }
      ] },
      options: { timeout: 30000 }
    }
  },
  output: [{"count": 1, "results": []}]
});
const openLibrarySearch = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'Open Library Search',
    onError: 'continueRegularOutput',
    parameters: {
      url: expr("https://openlibrary.org/search.json?limit=6&fields=key,title,subtitle,author_name,author_key,first_publish_year,isbn,subject,language,cover_i,ia,ebook_access,want_to_read_count,ratings_count&q={{ encodeURIComponent($('Loop Jobs').first().json.payload.q) }}"),
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'User-Agent', value: expr("BookVerse/1.0 ({{ $('Config').first().json.contactEmail }})") },
        { name: 'Accept', value: 'application/json' }
      ] },
      options: { timeout: 20000 }
    }
  },
  output: [{"numFound": 0, "docs": []}]
});
const googleBooksSearch = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'Google Books Search',
    onError: 'continueRegularOutput',
    parameters: {
      url: expr("https://www.googleapis.com/books/v1/volumes?maxResults=6&printType=books&q={{ encodeURIComponent($('Loop Jobs').first().json.payload.q) }}"),
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'User-Agent', value: expr("BookVerse/1.0 ({{ $('Config').first().json.contactEmail }})") },
        { name: 'Accept', value: 'application/json' }
      ] },
      options: { timeout: 20000 }
    }
  },
  output: [{"totalItems": 0, "items": []}]
});
const crossRefLookup = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'CrossRef Lookup',
    onError: 'continueRegularOutput',
    parameters: {
      url: expr("https://api.crossref.org/works?rows=3&select=DOI,title,type{{ String($('Config').first().json.contactEmail).includes('@') ? '&mailto=' + encodeURIComponent($('Config').first().json.contactEmail) : '' }}&query.bibliographic={{ encodeURIComponent($('Loop Jobs').first().json.payload.q) }}"),
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'User-Agent', value: expr("BookVerse/1.0 ({{ $('Config').first().json.contactEmail }})") },
        { name: 'Accept', value: 'application/json' }
      ] },
      options: { timeout: 20000 }
    }
  },
  output: [{"message": {"items": []}}]
});
const gutendexPage = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'Gutendex Page',
    onError: 'continueRegularOutput',
    parameters: {
      url: expr("https://gutendex.com/books?page={{ $('Loop Jobs').first().json.payload.page }}"),
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'User-Agent', value: expr("BookVerse/1.0 ({{ $('Config').first().json.contactEmail }})") },
        { name: 'Accept', value: 'application/json' }
      ] },
      options: { timeout: 30000 }
    }
  },
  output: [{"count": 1, "results": []}]
});
const openLibraryAuthor = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'Open Library Author',
    onError: 'continueRegularOutput',
    parameters: {
      url: expr("https://openlibrary.org/search/authors.json?limit=3&q={{ encodeURIComponent($('Loop Jobs').first().json.payload.name) }}"),
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'User-Agent', value: expr("BookVerse/1.0 ({{ $('Config').first().json.contactEmail }})") },
        { name: 'Accept', value: 'application/json' }
      ] },
      options: { timeout: 20000 }
    }
  },
  output: [{"docs": []}]
});
const wikipediaSummary = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'Wikipedia Summary',
    onError: 'continueRegularOutput',
    parameters: {
      url: expr("https://en.wikipedia.org/api/rest_v1/page/summary/{{ encodeURIComponent(String($('Loop Jobs').first().json.payload.name).replace(/ /g, '_')) }}"),
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: 'User-Agent', value: expr("BookVerse/1.0 ({{ $('Config').first().json.contactEmail }})") },
        { name: 'Accept', value: 'application/json' }
      ] },
      options: { timeout: 20000 }
    }
  },
  output: [{"type": "standard", "extract": ""}]
});
const normalizeSearch = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Normalize Search Results', parameters: { mode: 'runOnceForAllItems', jsCode: "function safe(name) {\n  try {\n    const j = $(name).first().json;\n    return j && !j.error ? j : null;\n  }\n  catch (e) {\n    return null;\n  }\n}\nconst norm = s => String(s || \"\").toLowerCase().normalize(\"NFD\").replace(/[\u0300-\u036f]/g, \"\").replace(/[^a-z0-9]+/g, \" \").trim();\nconst baseTitle = t => norm(String(t || \"\").split(\";\")[0].split(\":\")[0].replace(/^\\s*(the|a|an)\\s+/i, \"\"));\nconst popularity = (n, k) => Math.min(1000, Math.round(Math.log(1 + (Number(n) || 0)) * k));\nconst https = u => (u ? String(u).replace(/^http:\\/\\//, \"https://\") : null);\nconst clean = s => (s ? String(s).replace(/<[^>]+>/g, \" \").replace(/\\s+/g, \" \").trim() : null);\nconst LANG = { eng: \"en\", fre: \"fr\", fra: \"fr\", ger: \"de\", deu: \"de\", spa: \"es\", ita: \"it\", por: \"pt\", rus: \"ru\", jpn: \"ja\", chi: \"zh\", zho: \"zh\", dut: \"nl\", nld: \"nl\", lat: \"la\", gre: \"el\", swe: \"sv\", fin: \"fi\", dan: \"da\", nor: \"no\", pol: \"pl\", tgl: \"tl\", fil: \"tl\" };\nconst lang = l => LANG[l] || String(l || \"\").slice(0, 2);\n\nfunction fromGutendex(b) {\n  const f = b.formats || {};\n  const formats = [];\n  const add = (mime, format) => {\n    if (f[mime] && String(f[mime]).startsWith(\"https://\") && !formats.some(x => x.format === format))\n      formats.push({ format, url: f[mime], source: \"gutenberg\" });\n  };\n  add(\"application/epub+zip\", \"epub\");\n  add(\"application/x-mobipocket-ebook\", \"mobi\");\n  add(\"application/pdf\", \"pdf\");\n  add(\"text/plain; charset=utf-8\", \"txt\");\n  add(\"text/plain; charset=us-ascii\", \"txt\");\n  add(\"text/plain\", \"txt\");\n  add(\"text/html\", \"html\");\n  add(\"text/html; charset=utf-8\", \"html\");\n  return {\n    source: \"gutendex\",\n    title: b.title,\n    description: (b.summaries || [])[0] || null,\n    languages: b.languages || [],\n    coverUrl: f[\"image/jpeg\"] || null,\n    isPublicDomain: b.copyright !== true,\n    popularity: popularity(b.download_count, 70),\n    authors: (b.authors || []).map(a => ({ name: a.name, birthYear: a.birth_year, deathYear: a.death_year })),\n    subjects: (b.subjects || []).concat((b.bookshelves || []).map(s => String(s).replace(/^Category:\\s*/, \"\"))),\n    formats,\n    identifiers: [{ kind: \"gutenberg\", value: String(b.id) }],\n  };\n}\n\nfunction output(docs) {\n  const payload = JSON.stringify(docs.filter(d => d && d.title).slice(0, 20)).split(\"$bv$\").join(\"\");\n  return [{ json: { docs: payload, count: docs.length } }];\n}\n\nconst job = $('Loop Jobs').first().json;\nconst q = (job.payload && job.payload.q) || '';\nconst words = norm(q).split(' ').filter(w => w.length > 2);\nconst relevant = (title, authors) => {\n  const hay = norm(title) + ' ' + norm((authors || []).join(' '));\n  return words.length === 0 || words.filter(w => hay.includes(w)).length >= Math.ceil(words.length * 0.6);\n};\nconst ADAPTATION = /\\[(adaptation|abridged|graphic novel|retold)|\\b(adapted|retold|abridged|graphic novel|study guide|sparknotes|cliffsnotes)\\b/i;\nconst cleanTitle = t => String(t || '').replace(/\\s*\\[[^\\]]*\\]\\s*/g, ' ').replace(/\\s+/g, ' ').trim();\n// Open Library lists every translation's language; keep the book's own (English when present).\nconst mainLang = list => {\n  const l = (list || []).map(lang);\n  return l.includes('en') ? ['en'] : l.slice(0, 1);\n};\nconst docs = [];\n\nconst g = safe('Gutendex Search');\nfor (const b of ((g && g.results) || []).slice(0, 8)) {\n  if (relevant(b.title, (b.authors || []).map(a => a.name)))\n    docs.push(fromGutendex(b));\n}\n\nconst ol = safe('Open Library Search');\nfor (const d of ((ol && ol.docs) || []).slice(0, 6)) {\n  if (!d.title || !relevant(d.title, d.author_name) || ADAPTATION.test(d.title) || !(d.author_name || []).length)\n    continue;\n  const isPublic = d.ebook_access === 'public';\n  const ia = (d.ia || [])[0];\n  const formats = [];\n  if (isPublic && ia) {\n    formats.push({ format: 'pdf', url: 'https://archive.org/download/' + ia + '/' + ia + '.pdf', source: 'internet-archive' });\n    formats.push({ format: 'epub', url: 'https://archive.org/download/' + ia + '/' + ia + '.epub', source: 'internet-archive' });\n    formats.push({ format: 'html', url: 'https://archive.org/details/' + ia, source: 'internet-archive' });\n  }\n  const isbn = d.isbn || [];\n  const ids = [{ kind: 'openlibrary', value: String(d.key).replace('/works/', '') }];\n  const i13 = isbn.find(x => x.length === 13);\n  const i10 = isbn.find(x => x.length === 10);\n  if (i13)\n    ids.push({ kind: 'isbn13', value: i13 });\n  if (i10)\n    ids.push({ kind: 'isbn10', value: i10 });\n  docs.push({\n    source: 'openlibrary',\n    title: cleanTitle(d.title),\n    subtitle: d.subtitle || null,\n    firstPublishedYear: d.first_publish_year || null,\n    languages: mainLang(d.language),\n    coverUrl: d.cover_i ? 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-L.jpg' : null,\n    isPublicDomain: isPublic,\n    popularity: popularity((d.want_to_read_count || 0) + (d.ratings_count || 0), 80),\n    authors: (d.author_name || []).map((name, i) => ({ name, olKey: (d.author_key || [])[i] || null })),\n    subjects: (d.subject || []).slice(0, 15),\n    formats,\n    identifiers: ids,\n  });\n}\n\nconst gb = safe('Google Books Search');\nfor (const it of ((gb && gb.items) || []).slice(0, 6)) {\n  const v = it.volumeInfo || {};\n  const a = it.accessInfo || {};\n  if (!v.title || !relevant(v.title, v.authors) || ADAPTATION.test(v.title + ' ' + (v.subtitle || '')) || !(v.authors || []).length)\n    continue;\n  const ids = [{ kind: 'google', value: it.id }];\n  for (const x of v.industryIdentifiers || []) {\n    if (x.type === 'ISBN_13')\n      ids.push({ kind: 'isbn13', value: x.identifier });\n    if (x.type === 'ISBN_10')\n      ids.push({ kind: 'isbn10', value: x.identifier });\n  }\n  const formats = [];\n  if (a.publicDomain) {\n    if (a.epub && a.epub.downloadLink)\n      formats.push({ format: 'epub', url: https(a.epub.downloadLink), source: 'google-books' });\n    if (a.pdf && a.pdf.downloadLink)\n      formats.push({ format: 'pdf', url: https(a.pdf.downloadLink), source: 'google-books' });\n    if (a.webReaderLink)\n      formats.push({ format: 'html', url: https(a.webReaderLink), source: 'google-books' });\n  }\n  const year = parseInt(String(v.publishedDate || '').slice(0, 4), 10);\n  docs.push({\n    source: 'google-books',\n    title: cleanTitle(v.title),\n    subtitle: v.subtitle || null,\n    description: clean(v.description),\n    firstPublishedYear: Number.isFinite(year) ? year : null,\n    languages: v.language ? [v.language] : [],\n    coverUrl: v.imageLinks ? https(v.imageLinks.thumbnail || v.imageLinks.smallThumbnail) : null,\n    isPublicDomain: !!a.publicDomain,\n    popularity: popularity(v.ratingsCount, 90),\n    authors: (v.authors || []).map(name => ({ name })),\n    subjects: v.categories || [],\n    formats,\n    identifiers: ids,\n  });\n}\n\nconst cr = safe('CrossRef Lookup');\nfor (const w of ((cr && cr.message && cr.message.items) || [])) {\n  if (!['book', 'monograph', 'edited-book', 'reference-book'].includes(w.type))\n    continue;\n  const t = baseTitle((w.title || [])[0]);\n  const match = docs.find(d => baseTitle(d.title) === t);\n  if (match && w.DOI)\n    match.identifiers.push({ kind: 'doi', value: String(w.DOI).toLowerCase() });\n}\n\nreturn output(docs);\n" } },
  output: [{ docs: '[]', count: 0 }]
});

const normalizeDiscover = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Normalize Gutendex Page', parameters: { mode: 'runOnceForAllItems', jsCode: "function safe(name) {\n  try {\n    const j = $(name).first().json;\n    return j && !j.error ? j : null;\n  }\n  catch (e) {\n    return null;\n  }\n}\nconst norm = s => String(s || \"\").toLowerCase().normalize(\"NFD\").replace(/[\u0300-\u036f]/g, \"\").replace(/[^a-z0-9]+/g, \" \").trim();\nconst baseTitle = t => norm(String(t || \"\").split(\";\")[0].split(\":\")[0].replace(/^\\s*(the|a|an)\\s+/i, \"\"));\nconst popularity = (n, k) => Math.min(1000, Math.round(Math.log(1 + (Number(n) || 0)) * k));\nconst https = u => (u ? String(u).replace(/^http:\\/\\//, \"https://\") : null);\nconst clean = s => (s ? String(s).replace(/<[^>]+>/g, \" \").replace(/\\s+/g, \" \").trim() : null);\nconst LANG = { eng: \"en\", fre: \"fr\", fra: \"fr\", ger: \"de\", deu: \"de\", spa: \"es\", ita: \"it\", por: \"pt\", rus: \"ru\", jpn: \"ja\", chi: \"zh\", zho: \"zh\", dut: \"nl\", nld: \"nl\", lat: \"la\", gre: \"el\", swe: \"sv\", fin: \"fi\", dan: \"da\", nor: \"no\", pol: \"pl\", tgl: \"tl\", fil: \"tl\" };\nconst lang = l => LANG[l] || String(l || \"\").slice(0, 2);\n\nfunction fromGutendex(b) {\n  const f = b.formats || {};\n  const formats = [];\n  const add = (mime, format) => {\n    if (f[mime] && String(f[mime]).startsWith(\"https://\") && !formats.some(x => x.format === format))\n      formats.push({ format, url: f[mime], source: \"gutenberg\" });\n  };\n  add(\"application/epub+zip\", \"epub\");\n  add(\"application/x-mobipocket-ebook\", \"mobi\");\n  add(\"application/pdf\", \"pdf\");\n  add(\"text/plain; charset=utf-8\", \"txt\");\n  add(\"text/plain; charset=us-ascii\", \"txt\");\n  add(\"text/plain\", \"txt\");\n  add(\"text/html\", \"html\");\n  add(\"text/html; charset=utf-8\", \"html\");\n  return {\n    source: \"gutendex\",\n    title: b.title,\n    description: (b.summaries || [])[0] || null,\n    languages: b.languages || [],\n    coverUrl: f[\"image/jpeg\"] || null,\n    isPublicDomain: b.copyright !== true,\n    popularity: popularity(b.download_count, 70),\n    authors: (b.authors || []).map(a => ({ name: a.name, birthYear: a.birth_year, deathYear: a.death_year })),\n    subjects: (b.subjects || []).concat((b.bookshelves || []).map(s => String(s).replace(/^Category:\\s*/, \"\"))),\n    formats,\n    identifiers: [{ kind: \"gutenberg\", value: String(b.id) }],\n  };\n}\n\nfunction output(docs) {\n  const payload = JSON.stringify(docs.filter(d => d && d.title).slice(0, 20)).split(\"$bv$\").join(\"\");\n  return [{ json: { docs: payload, count: docs.length } }];\n}\n\nconst page = safe('Gutendex Page');\nconst docs = ((page && page.results) || []).map(fromGutendex);\nreturn output(docs);\n" } },
  output: [{ docs: '[]', count: 0 }]
});

const buildAuthor = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Build Author Update', parameters: { mode: 'runOnceForAllItems', jsCode: "function safe(name) {\n  try {\n    const j = $(name).first().json;\n    return j && !j.error ? j : null;\n  }\n  catch (e) {\n    return null;\n  }\n}\nconst norm = s => String(s || \"\").toLowerCase().normalize(\"NFD\").replace(/[\u0300-\u036f]/g, \"\").replace(/[^a-z0-9]+/g, \" \").trim();\nconst baseTitle = t => norm(String(t || \"\").split(\";\")[0].split(\":\")[0].replace(/^\\s*(the|a|an)\\s+/i, \"\"));\nconst popularity = (n, k) => Math.min(1000, Math.round(Math.log(1 + (Number(n) || 0)) * k));\nconst https = u => (u ? String(u).replace(/^http:\\/\\//, \"https://\") : null);\nconst clean = s => (s ? String(s).replace(/<[^>]+>/g, \" \").replace(/\\s+/g, \" \").trim() : null);\nconst LANG = { eng: \"en\", fre: \"fr\", fra: \"fr\", ger: \"de\", deu: \"de\", spa: \"es\", ita: \"it\", por: \"pt\", rus: \"ru\", jpn: \"ja\", chi: \"zh\", zho: \"zh\", dut: \"nl\", nld: \"nl\", lat: \"la\", gre: \"el\", swe: \"sv\", fin: \"fi\", dan: \"da\", nor: \"no\", pol: \"pl\", tgl: \"tl\", fil: \"tl\" };\nconst lang = l => LANG[l] || String(l || \"\").slice(0, 2);\n\nfunction fromGutendex(b) {\n  const f = b.formats || {};\n  const formats = [];\n  const add = (mime, format) => {\n    if (f[mime] && String(f[mime]).startsWith(\"https://\") && !formats.some(x => x.format === format))\n      formats.push({ format, url: f[mime], source: \"gutenberg\" });\n  };\n  add(\"application/epub+zip\", \"epub\");\n  add(\"application/x-mobipocket-ebook\", \"mobi\");\n  add(\"application/pdf\", \"pdf\");\n  add(\"text/plain; charset=utf-8\", \"txt\");\n  add(\"text/plain; charset=us-ascii\", \"txt\");\n  add(\"text/plain\", \"txt\");\n  add(\"text/html\", \"html\");\n  add(\"text/html; charset=utf-8\", \"html\");\n  return {\n    source: \"gutendex\",\n    title: b.title,\n    description: (b.summaries || [])[0] || null,\n    languages: b.languages || [],\n    coverUrl: f[\"image/jpeg\"] || null,\n    isPublicDomain: b.copyright !== true,\n    popularity: popularity(b.download_count, 70),\n    authors: (b.authors || []).map(a => ({ name: a.name, birthYear: a.birth_year, deathYear: a.death_year })),\n    subjects: (b.subjects || []).concat((b.bookshelves || []).map(s => String(s).replace(/^Category:\\s*/, \"\"))),\n    formats,\n    identifiers: [{ kind: \"gutenberg\", value: String(b.id) }],\n  };\n}\n\nfunction output(docs) {\n  const payload = JSON.stringify(docs.filter(d => d && d.title).slice(0, 20)).split(\"$bv$\").join(\"\");\n  return [{ json: { docs: payload, count: docs.length } }];\n}\n\nconst job = $('Loop Jobs').first().json;\nconst p = job.payload || {};\nconst target = norm(p.name);\nconst ol = safe('Open Library Author');\nconst wiki = safe('Wikipedia Summary');\nconst oa = ((ol && ol.docs) || []).find(d => norm(d.name) === target) || null;\nconst year = s => {\n  const m = String(s || '').match(/\\d{3,4}/);\n  return m ? Number(m[0]) : null;\n};\nconst literary = /(writer|novelist|poet|author|playwright|dramatist|philosopher|essayist|journalist|historian|scientist|critic|translator|theologian|naturalist|economist)/i;\nlet bio = '';\nlet photo = null;\nif (wiki && wiki.type === 'standard' && literary.test((wiki.description || '') + ' ' + String(wiki.extract || '').slice(0, 400))) {\n  bio = wiki.extract || '';\n  photo = (wiki.thumbnail && wiki.thumbnail.source) || null;\n}\nconst update = {\n  authorId: p.authorId,\n  bio: bio.slice(0, 2000),\n  photoUrl: photo,\n  olKey: oa ? oa.key : null,\n  birthYear: oa ? year(oa.birth_date) : null,\n  deathYear: oa ? year(oa.death_date) : null,\n};\nreturn [{ json: { update: JSON.stringify(update).split('$bv$').join('') } }];\n" } },
  output: [{ update: '{}' }]
});

const ingestDocs = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Ingest Books',
    onError: 'continueRegularOutput',
    parameters: { operation: 'executeQuery', query: "SELECT count(bv_ingest_work(d))::int AS ingested FROM jsonb_array_elements($bv${{ $json.docs }}$bv$::jsonb) AS d;", options: {} },
    credentials: { postgres: newCredential('BookVerse Neon (catalog-v2)') }
  },
  output: [{"ingested": 3}]
});
const updateAuthor = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Update Author',
    onError: 'continueRegularOutput',
    parameters: { operation: 'executeQuery', query: "WITH x AS (SELECT $bv${{ $json.update }}$bv$::jsonb AS j),\nu AS (\n  UPDATE authors a SET\n    bio = coalesce(a.bio, x.j ->> 'bio'),\n    photo_url = coalesce(a.photo_url, nullif(x.j ->> 'photoUrl', '')),\n    ol_key = CASE WHEN a.ol_key IS NULL AND NOT EXISTS (SELECT 1 FROM authors o WHERE o.ol_key = x.j ->> 'olKey') THEN nullif(x.j ->> 'olKey', '') ELSE a.ol_key END,\n    birth_year = coalesce(a.birth_year, nullif(x.j ->> 'birthYear', '')::smallint),\n    death_year = coalesce(a.death_year, nullif(x.j ->> 'deathYear', '')::smallint),\n    enrich_level = greatest(a.enrich_level, 1),\n    updated_at = now()\n  FROM x WHERE a.id = (x.j ->> 'authorId')::uuid\n  RETURNING 1\n)\nSELECT count(*)::int AS updated FROM u;", options: {} },
    credentials: { postgres: newCredential('BookVerse Neon (catalog-v2)') }
  },
  output: [{"updated": 1}]
});
const finishJob = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Finish Job',
    parameters: { operation: 'executeQuery', query: "WITH d AS (DELETE FROM ingest_queue WHERE id = {{ $('Loop Jobs').first().json.id }} AND {{ !$json.error }} RETURNING 1) SELECT count(*)::int AS finished FROM d;", options: {} },
    credentials: { postgres: newCredential('BookVerse Neon (catalog-v2)') }
  },
  output: [{"finished": 1}]
});
const politeDelay = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Polite Delay', parameters: { resume: 'timeInterval', amount: 4, unit: 'seconds' } },
  output: [{ finished: 1 }]
});

const note = sticky('## BookVerse catalog ingest\nEvery 20 min this claims up to 3 jobs from the Neon `ingest_queue`: searches with few results, author pages without a bio, or (when idle) the next page of popular Gutendex books.\n\nProviders: Gutendex, Open Library, Google Books, CrossRef (DOI only) and Wikipedia (author bios). All matching and de-duplication happens in Postgres (`bv_ingest_work`), so nothing is stored in n8n.', [], { color: 4, width: 560, height: 260 });

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
