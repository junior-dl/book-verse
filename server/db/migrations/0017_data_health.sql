-- Weekly data health check. Flags suspicious catalog data for a human to review;
-- it never changes catalog data itself.

CREATE TABLE IF NOT EXISTS "data_flags" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "kind" text NOT NULL,                 -- many_authors | author_after_pub | possible_duplicate
  "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE cascade,
  "author_id" uuid REFERENCES "authors"("id") ON DELETE cascade,
  "other_work_id" uuid REFERENCES "works"("id") ON DELETE cascade,
  "detail" text NOT NULL,
  "status" text DEFAULT 'open' NOT NULL, -- open | dismissed | fixed
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "resolved_at" timestamp with time zone
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "data_flags_identity_idx"
  ON "data_flags" ("kind", "work_id", coalesce("author_id", '00000000-0000-0000-0000-000000000000'::uuid), coalesce("other_work_id", '00000000-0000-0000-0000-000000000000'::uuid));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "data_flags_status_idx" ON "data_flags" ("status", "created_at");--> statement-breakpoint

-- Returns how many flags are new this run, how many were auto-closed, and how many are open.
CREATE OR REPLACE FUNCTION bv_scan_health() RETURNS TABLE (new_flags int, auto_fixed int, open_flags int)
LANGUAGE plpgsql AS $$
DECLARE n_new int; n_fixed int;
BEGIN
  CREATE TEMP TABLE _found (kind text, work_id uuid, author_id uuid, other_work_id uuid, detail text) ON COMMIT DROP;

  -- 1. Books with 3 or more authors (often a compilation or anthology merged in)
  INSERT INTO _found
  SELECT 'many_authors', w.id, NULL::uuid, NULL::uuid,
         count(*) || ' authors: ' || string_agg(a.name, ', ' ORDER BY wa.position)
  FROM works w JOIN work_authors wa ON wa.work_id = w.id JOIN authors a ON a.id = wa.author_id
  GROUP BY w.id HAVING count(*) >= 3;

  -- 2. An author born after the book was first published (e.g. Melville, b. 1819, on a 1813 novel)
  INSERT INTO _found
  SELECT 'author_after_pub', w.id, a.id, NULL::uuid,
         a.name || ' was born in ' || a.birth_year || ', but the book was first published in ' || w.first_published_year
  FROM works w JOIN work_authors wa ON wa.work_id = w.id JOIN authors a ON a.id = wa.author_id
  WHERE a.birth_year IS NOT NULL AND w.first_published_year IS NOT NULL
    AND a.birth_year > w.first_published_year;

  -- 3. Possible duplicates: same author, near-identical titles, still two books
  INSERT INTO _found
  SELECT DISTINCT ON (least(w1.id, w2.id), greatest(w1.id, w2.id))
         'possible_duplicate', least(w1.id, w2.id), NULL::uuid, greatest(w1.id, w2.id),
         '"' || w1.title || '" and "' || w2.title || '" by ' || a.name
  FROM work_authors wa1
  JOIN work_authors wa2 ON wa2.author_id = wa1.author_id AND wa2.work_id > wa1.work_id
  JOIN works w1 ON w1.id = wa1.work_id
  JOIN works w2 ON w2.id = wa2.work_id
  JOIN authors a ON a.id = wa1.author_id
  WHERE w1.title_norm % w2.title_norm
    AND similarity(bv_base_title(w1.title), bv_base_title(w2.title)) > 0.8
    -- numbered volumes / parts of a set are separate books on purpose
    AND w1.title_norm !~ '\m(vol|volume|part|book|tome)\M\s*([0-9]+|[ivxlc]+)\M'
    AND w2.title_norm !~ '\m(vol|volume|part|book|tome)\M\s*([0-9]+|[ivxlc]+)\M';

  INSERT INTO data_flags (kind, work_id, author_id, other_work_id, detail)
  SELECT kind, work_id, author_id, other_work_id, detail FROM _found
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n_new = ROW_COUNT;

  -- Open flags whose problem is gone (fixed by hand or by a later merge) close themselves
  UPDATE data_flags f SET status = 'fixed', resolved_at = now()
  WHERE f.status = 'open' AND NOT EXISTS (
    SELECT 1 FROM _found x
    WHERE x.kind = f.kind AND x.work_id = f.work_id
      AND x.author_id IS NOT DISTINCT FROM f.author_id
      AND x.other_work_id IS NOT DISTINCT FROM f.other_work_id);
  GET DIAGNOSTICS n_fixed = ROW_COUNT;

  -- Keep the table small: drop resolved flags after 90 days
  DELETE FROM data_flags WHERE status <> 'open' AND resolved_at < now() - interval '90 days';

  RETURN QUERY SELECT n_new, n_fixed, (SELECT count(*)::int FROM data_flags WHERE status = 'open');
END
$$;
