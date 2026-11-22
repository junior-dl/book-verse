// @ts-nocheck — n8n Workflow SDK source, parsed by n8n (not part of the Nuxt build)
import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const hourly = trigger({
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

const pending = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Get Pending Subjects',
    parameters: { operation: 'executeQuery', query: "WITH p AS (\n  SELECT alias_norm FROM subject_aliases WHERE decided_by = 'pending'\n  ORDER BY alias_norm LIMIT {{ $json.aliasesPerCall }}\n)\nSELECT json_agg(alias_norm) AS aliases, (SELECT json_agg(slug ORDER BY sort_order) FROM subjects) AS subjects\nFROM p\nHAVING CASE WHEN count(*) > 0 THEN bv_take_budget('gemini', {{ $json.geminiDailyLimit }}) ELSE false END;", options: {} },
    credentials: { postgres: newCredential('BookVerse Neon (catalog-v2)') }
  },
  output: [{"aliases": ["whaling fiction"], "subjects": ["fiction", "adventure"]}]
});
const buildRequest = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Build Gemini Request', parameters: { mode: 'runOnceForAllItems', jsCode: "const row = $input.first().json;\nconst aliases = row.aliases || [];\nconst subjects = row.subjects || [];\nconst prompt = [\n  'You map messy library subject headings to a fixed list of genres for a reading app.',\n  'Allowed subject slugs: ' + subjects.join(', ') + '.',\n  'For each heading return the single best slug, or null if it is not a genre/topic a reader would browse by',\n  '(e.g. call numbers, places alone, \"translations into english\", years, publisher series).',\n  'Prefer the most specific fitting slug. Use \"fiction\" only for general fiction with no better fit.',\n  'Headings:',\n  JSON.stringify(aliases),\n].join('\\n');\nconst body = {\n  contents: [{ role: 'user', parts: [{ text: prompt }] }],\n  generationConfig: {\n    temperature: 0,\n    responseMimeType: 'application/json',\n    responseSchema: {\n      type: 'ARRAY',\n      items: {\n        type: 'OBJECT',\n        properties: {\n          alias: { type: 'STRING' },\n          subject: { type: 'STRING', nullable: true },\n        },\n        required: ['alias', 'subject'],\n      },\n    },\n  },\n};\nreturn [{ json: { body, aliases, subjects } }];\n" } },
  output: [{ body: {}, aliases: [], subjects: [] }]
});

const callGemini = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'Classify with Gemini',
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 5000,
    parameters: {
      method: 'POST',
      url: expr("https://generativelanguage.googleapis.com/v1beta/models/{{ $('Config').first().json.model }}:generateContent"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body) }}'),
      options: { timeout: 60000 }
    },
    credentials: { googlePalmApi: newCredential('BookVerse – Gemini API') }
  },
  output: [{ candidates: [{ content: { parts: [{ text: '[]' }] } }] }]
});

const parse = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Parse Classifications', parameters: { mode: 'runOnceForAllItems', jsCode: "const req = $('Build Gemini Request').first().json;\nconst res = $input.first().json;\nconst allowed = new Set(req.subjects || []);\nconst asked = new Set(req.aliases || []);\nlet parsed = [];\ntry {\n  const text = res.candidates[0].content.parts.map(p => p.text || '').join('');\n  parsed = JSON.parse(text.replace(/^```(json)?|```$/g, '').trim());\n}\ncatch (e) {\n  parsed = [];\n}\nconst items = (Array.isArray(parsed) ? parsed : [])\n  .filter(x => x && asked.has(x.alias))\n  .map(x => ({ alias: x.alias, subject: allowed.has(x.subject) ? x.subject : null }));\nreturn [{ json: { items: JSON.stringify(items).split('$bv$').join(''), count: items.length } }];\n" } },
  output: [{ items: '[]', count: 0 }]
});

const apply = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Apply to Catalog',
    parameters: { operation: 'executeQuery', query: "SELECT bv_apply_subject_aliases($bv${{ $json.items }}$bv$::jsonb) AS classified;", options: {} },
    credentials: { postgres: newCredential('BookVerse Neon (catalog-v2)') }
  },
  output: [{"classified": 60}]
});
const note = sticky('## BookVerse AI tidy (Gemini)\nOnce an hour, sends up to 60 unclassified provider subject headings to Gemini in ONE request and maps them onto the 24 BookVerse subjects.\n\nFree-tier safe: `bv_take_budget` stops at `geminiDailyLimit` calls/day (counted in Neon, resets at midnight Pacific). Runs with nothing pending cost nothing.', [], { color: 5, width: 520, height: 240 });

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
