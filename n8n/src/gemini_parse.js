const req = $('Build Gemini Request').first().json;
const res = $input.first().json;
const allowed = new Set(req.subjects || []);
const asked = new Set(req.aliases || []);
let parsed = [];
try {
  const text = res.candidates[0].content.parts.map(p => p.text || '').join('');
  parsed = JSON.parse(text.replace(/^```(json)?|```$/g, '').trim());
}
catch (e) {
  parsed = [];
}
const items = (Array.isArray(parsed) ? parsed : [])
  .filter(x => x && asked.has(x.alias))
  .map(x => ({ alias: x.alias, subject: allowed.has(x.subject) ? x.subject : null }));
return [{ json: { items: JSON.stringify(items).split('$bv$').join(''), count: items.length } }];
