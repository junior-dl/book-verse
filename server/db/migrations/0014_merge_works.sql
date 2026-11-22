-- Helpers for de-duplicating works. Used once here and then by the n8n companion.

-- "Frankenstein; Or, The Modern Prometheus" -> "frankenstein"
CREATE OR REPLACE FUNCTION bv_base_title(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT bv_norm(regexp_replace(split_part(split_part(coalesce(t, ''), ';', 1), ':', 1), '^\s*(the|a|an)\s+', '', 'i'))
$$;--> statement-breakpoint

-- Move everything from `drop_id` onto `keep_id`, then delete `drop_id`.
CREATE OR REPLACE FUNCTION bv_merge_works(keep_id uuid, drop_id uuid) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF keep_id = drop_id THEN RETURN; END IF;

  UPDATE work_identifiers SET work_id = keep_id WHERE work_id = drop_id;

  INSERT INTO work_formats (work_id, format, url, source)
    SELECT keep_id, format, url, source FROM work_formats WHERE work_id = drop_id
    ON CONFLICT DO NOTHING;
  INSERT INTO work_subjects (work_id, subject_id)
    SELECT keep_id, subject_id FROM work_subjects WHERE work_id = drop_id
    ON CONFLICT DO NOTHING;
  INSERT INTO work_authors (work_id, author_id, position, role)
    SELECT keep_id, author_id, position, role FROM work_authors WHERE work_id = drop_id
    ON CONFLICT DO NOTHING;

  INSERT INTO favorites (profile_id, work_id, created_at)
    SELECT profile_id, keep_id, created_at FROM favorites WHERE work_id = drop_id
    ON CONFLICT DO NOTHING;
  INSERT INTO reading_status (profile_id, work_id, status, created_at, updated_at)
    SELECT profile_id, keep_id, status, created_at, updated_at FROM reading_status WHERE work_id = drop_id
    ON CONFLICT DO NOTHING;
  INSERT INTO shelf_books (shelf_id, work_id, added_at)
    SELECT shelf_id, keep_id, added_at FROM shelf_books WHERE work_id = drop_id
    ON CONFLICT DO NOTHING;
  INSERT INTO reviews (profile_id, work_id, rating, review_text, created_at, updated_at)
    SELECT profile_id, keep_id, rating, review_text, created_at, updated_at FROM reviews WHERE work_id = drop_id
    ON CONFLICT DO NOTHING;

  UPDATE works k SET
    description = coalesce(k.description, d.description),
    cover_url = coalesce(k.cover_url, d.cover_url),
    first_published_year = coalesce(least(k.first_published_year, d.first_published_year), k.first_published_year, d.first_published_year),
    languages = ARRAY(SELECT DISTINCT unnest(k.languages || d.languages)),
    is_public_domain = k.is_public_domain OR d.is_public_domain,
    popularity = greatest(k.popularity, d.popularity),
    updated_at = now()
  FROM works d
  WHERE k.id = keep_id AND d.id = drop_id;

  DELETE FROM works WHERE id = drop_id; -- cascades the leftovers
END
$$;--> statement-breakpoint

-- Strip MARC subfield codes ("$b", "$c") that leak into Gutenberg titles
UPDATE works
SET title = trim(regexp_replace(regexp_replace(title, '\s*\$[a-z]\s*', ' ', 'g'), '\s+([:;,])', '\1', 'g')),
    title_norm = bv_norm(trim(regexp_replace(title, '\s*\$[a-z]\s*', ' ', 'g')))
WHERE title ~ '\$[a-z]';--> statement-breakpoint

-- Merge works that share a base title AND an author; keep the most popular one
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT DISTINCT ON (d.id) k.id AS keep_id, d.id AS drop_id
    FROM works k
    JOIN works d ON bv_base_title(d.title) = bv_base_title(k.title)
      AND (d.popularity, d.id) < (k.popularity, k.id)
    WHERE EXISTS (
      SELECT 1 FROM work_authors a JOIN work_authors b ON a.author_id = b.author_id
      WHERE a.work_id = k.id AND b.work_id = d.id
    )
    ORDER BY d.id, k.popularity DESC
  LOOP
    IF EXISTS (SELECT 1 FROM works WHERE id = r.keep_id) AND EXISTS (SELECT 1 FROM works WHERE id = r.drop_id) THEN
      PERFORM bv_merge_works(r.keep_id, r.drop_id);
    END IF;
  END LOOP;
END
$$;
