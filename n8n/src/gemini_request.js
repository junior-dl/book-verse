const row = $input.first().json;
const aliases = row.aliases || [];
const subjects = row.subjects || [];
const prompt = [
  'You map messy library subject headings to a fixed list of genres for a reading app.',
  'Allowed subject slugs: ' + subjects.join(', ') + '.',
  'For each heading return the single best slug, or null if it is not a genre/topic a reader would browse by',
  '(e.g. call numbers, places alone, "translations into english", years, publisher series).',
  'Prefer the most specific fitting slug. Use "fiction" only for general fiction with no better fit.',
  'Headings:',
  JSON.stringify(aliases),
].join('\n');
const body = {
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: 0,
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          alias: { type: 'STRING' },
          subject: { type: 'STRING', nullable: true },
        },
        required: ['alias', 'subject'],
      },
    },
  },
};
return [{ json: { body, aliases, subjects } }];
