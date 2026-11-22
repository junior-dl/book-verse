// @ts-nocheck — n8n Workflow SDK source, parsed by n8n (not part of the Nuxt build)
import { workflow, node, trigger, sticky, newCredential } from '@n8n/workflow-sdk';

const weekly = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: { name: 'Every Monday 9:00', parameters: { rule: { interval: [{ field: 'weeks', weeksInterval: 1, triggerAtDay: [1], triggerAtHour: 9, triggerAtMinute: 7 }] } } },
  output: [{}]
});

const scan = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Scan Catalog Health',
    parameters: { operation: 'executeQuery', query: 'SELECT * FROM bv_scan_health();', options: {} },
    credentials: { postgres: newCredential('BookVerse Neon (catalog-v2)') }
  },
  output: [{ new_flags: 1, auto_fixed: 0, open_flags: 1 }]
});

const note = sticky('## BookVerse data health\nEvery Monday, `bv_scan_health()` flags suspicious catalog data: books with 3+ authors, an author born after the book was first published, and possible duplicates (same author, near-identical titles). It never edits the catalog.\n\nReview flags at **/admin/flags** in BookVerse. Flags whose problem disappears close themselves.', [], { color: 6, width: 480, height: 220 });

export default workflow('bookverse-health', 'BookVerse – Weekly Data Health')
  .add(weekly)
  .to(scan)
  .add(note);
