-- A merge must never add authors to a work that already has them: compilations and
-- box sets list extra authors and were attaching them (e.g. Melville on Pride and Prejudice).
CREATE OR REPLACE FUNCTION bv_ingest_work(doc jsonb) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_title text := trim(regexp_replace(coalesce(doc ->> 'title', ''), '\s*\$[a-z]\s*', ' ', 'g'));
  v_base text := bv_base_title(v_title);
  v_work uuid;
  v_is_new boolean := false;
  v_author_norms text[];
  v_aid uuid;
  a jsonb;
  i int := 0;
  s text;
BEGIN
  IF v_base = '' THEN RETURN NULL; END IF;
  SELECT coalesce(array_agg(bv_norm(bv_display_name(x ->> 'name'))), '{}')
  INTO v_author_norms
  FROM jsonb_array_elements(coalesce(doc -> 'authors', '[]')) x;

  -- 1. shared identifier
  SELECT wi.work_id INTO v_work
  FROM jsonb_array_elements(coalesce(doc -> 'identifiers', '[]')) x
  JOIN work_identifiers wi ON wi.kind = x ->> 'kind' AND wi.value = x ->> 'value'
  LIMIT 1;

  -- 2. same base title + an overlapping author
  IF v_work IS NULL AND array_length(v_author_norms, 1) > 0 THEN
    SELECT w.id INTO v_work
    FROM works w
    JOIN work_authors wa ON wa.work_id = w.id
    JOIN authors au ON au.id = wa.author_id
    WHERE w.title_norm % v_base
      AND bv_base_title(w.title) = v_base
      AND EXISTS (SELECT 1 FROM unnest(v_author_norms) n WHERE similarity(au.name_norm, n) > 0.6)
    ORDER BY w.popularity DESC
    LIMIT 1;
  END IF;

  IF v_work IS NULL THEN
    v_is_new := true;
    v_work := gen_random_uuid();
    INSERT INTO works (id, slug, title, title_norm, subtitle, description, first_published_year,
                       languages, cover_url, is_public_domain, popularity, enrich_level)
    VALUES (
      v_work,
      bv_slug(v_title) || '-' || left(replace(v_work::text, '-', ''), 6),
      v_title, bv_norm(v_title),
      nullif(doc ->> 'subtitle', ''),
      nullif(left(doc ->> 'description', 4000), ''),
      nullif(doc ->> 'firstPublishedYear', '')::smallint,
      ARRAY(SELECT jsonb_array_elements_text(coalesce(doc -> 'languages', '[]'))),
      nullif(doc ->> 'coverUrl', ''),
      coalesce((doc ->> 'isPublicDomain')::boolean, false),
      least(1000, greatest(0, coalesce((doc ->> 'popularity')::int, 0))),
      0);
  ELSE
    UPDATE works SET
      subtitle = coalesce(subtitle, nullif(doc ->> 'subtitle', '')),
      description = CASE
        WHEN length(coalesce(doc ->> 'description', '')) > length(coalesce(description, '')) + 40
        THEN left(doc ->> 'description', 4000) ELSE description END,
      first_published_year = CASE
        WHEN nullif(doc ->> 'firstPublishedYear', '') IS NULL THEN first_published_year
        ELSE least(coalesce(first_published_year, 32767), (doc ->> 'firstPublishedYear')::smallint) END,
      languages = ARRAY(SELECT DISTINCT unnest(languages || ARRAY(SELECT jsonb_array_elements_text(coalesce(doc -> 'languages', '[]'))))),
      cover_url = coalesce(cover_url, nullif(doc ->> 'coverUrl', '')),
      is_public_domain = is_public_domain OR coalesce((doc ->> 'isPublicDomain')::boolean, false),
      popularity = greatest(popularity, least(1000, coalesce((doc ->> 'popularity')::int, 0))),
      enrich_level = greatest(enrich_level, 1),
      updated_at = now()
    WHERE id = v_work;
  END IF;

  -- authors: only for a new work, or one that has none yet
  IF v_is_new OR NOT EXISTS (SELECT 1 FROM work_authors WHERE work_id = v_work) THEN
    FOR a IN SELECT * FROM jsonb_array_elements(coalesce(doc -> 'authors', '[]')) LOOP
      v_aid := bv_upsert_author(a);
      IF v_aid IS NOT NULL THEN
        INSERT INTO work_authors (work_id, author_id, position) VALUES (v_work, v_aid, i) ON CONFLICT DO NOTHING;
        i := i + 1;
      END IF;
    END LOOP;
  END IF;

  -- identifiers: on a merge, only when the doc's authors all match the work's authors
  -- (a compilation's ISBN must not be claimed by one of its books)
  IF v_is_new OR NOT EXISTS (
    SELECT 1 FROM unnest(v_author_norms) n
    WHERE NOT EXISTS (
      SELECT 1 FROM work_authors wa JOIN authors au ON au.id = wa.author_id
      WHERE wa.work_id = v_work AND similarity(au.name_norm, n) > 0.6)
  ) THEN
    INSERT INTO work_identifiers (kind, value, work_id)
    SELECT x ->> 'kind', x ->> 'value', v_work
    FROM jsonb_array_elements(coalesce(doc -> 'identifiers', '[]')) x
    WHERE coalesce(x ->> 'value', '') <> ''
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO work_formats (work_id, format, url, source)
  SELECT v_work, x ->> 'format', x ->> 'url', coalesce(x ->> 'source', doc ->> 'source', 'unknown')
  FROM jsonb_array_elements(coalesce(doc -> 'formats', '[]')) x
  WHERE x ->> 'format' IN ('epub', 'pdf', 'mobi', 'azw3', 'txt', 'html', 'audio')
    AND x ->> 'url' LIKE 'https://%'
  ON CONFLICT DO NOTHING;

  FOR s IN
    SELECT DISTINCT bv_norm(x) FROM jsonb_array_elements_text(coalesce(doc -> 'subjects', '[]')) x
    WHERE length(bv_norm(x)) BETWEEN 3 AND 120
    LIMIT 25
  LOOP
    INSERT INTO subject_aliases (alias_norm, subject_id, decided_by) VALUES (s, NULL, 'pending') ON CONFLICT DO NOTHING;
    INSERT INTO work_raw_subjects (work_id, alias_norm) VALUES (v_work, s) ON CONFLICT DO NOTHING;
    INSERT INTO work_subjects (work_id, subject_id)
    SELECT v_work, sa.subject_id FROM subject_aliases sa
    WHERE sa.alias_norm = s AND sa.subject_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN v_work;
END
$$;--> statement-breakpoint

-- Clean up: Pride and Prejudice picked up Melville and a compilation's identifiers
DELETE FROM work_authors wa USING works w, authors a
WHERE wa.work_id = w.id AND wa.author_id = a.id
  AND w.title = 'Pride and Prejudice' AND a.name = 'Herman Melville';--> statement-breakpoint
DELETE FROM work_identifiers
WHERE (kind, value) IN (('openlibrary', 'OL15165350W'), ('isbn13', '9798583924769'), ('isbn10', '0785846239'));
