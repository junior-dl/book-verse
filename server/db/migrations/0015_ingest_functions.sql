-- Ingest API used by the n8n companion. n8n sends one normalized JSON document per book;
-- all matching / merging / dedupe happens here so n8n stays tiny and logic is versioned in git.
--
-- Input shape (every field optional except title):
-- {
--   "title": "...", "subtitle": "...", "description": "...", "firstPublishedYear": 1851,
--   "languages": ["en"], "coverUrl": "https://...", "popularity": 0..1000, "isPublicDomain": true,
--   "authors":     [{ "name": "Herman Melville", "birthYear": 1819, "deathYear": 1891, "olKey": "OL1A" }],
--   "subjects":    ["Whaling -- Fiction", "Sea stories"],
--   "formats":     [{ "format": "epub", "url": "https://...", "source": "gutenberg" }],
--   "identifiers": [{ "kind": "gutenberg", "value": "2701" }, { "kind": "isbn13", "value": "978..." }],
--   "source": "gutendex"
-- }

-- Which raw (alias) subjects each work came with, so later Gemini decisions re-tag old works.
CREATE TABLE IF NOT EXISTS work_raw_subjects (
  work_id uuid NOT NULL REFERENCES works(id) ON DELETE cascade,
  alias_norm text NOT NULL REFERENCES subject_aliases(alias_norm) ON DELETE cascade,
  PRIMARY KEY (work_id, alias_norm)
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS work_raw_subjects_alias_idx ON work_raw_subjects (alias_norm);--> statement-breakpoint

CREATE OR REPLACE FUNCTION bv_upsert_author(a jsonb) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_name text := bv_display_name(a ->> 'name');
  v_norm text := bv_norm(v_name);
  v_birth smallint := nullif(a ->> 'birthYear', '')::smallint;
  v_death smallint := nullif(a ->> 'deathYear', '')::smallint;
  v_ol text := nullif(a ->> 'olKey', '');
  v_id uuid;
BEGIN
  IF v_norm = '' THEN RETURN NULL; END IF;

  -- 1. strongest: Open Library key
  IF v_ol IS NOT NULL THEN
    SELECT id INTO v_id FROM authors WHERE ol_key = v_ol;
  END IF;

  -- 2. same normalized name and compatible birth year
  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM authors
    WHERE name_norm = v_norm AND (birth_year IS NULL OR v_birth IS NULL OR birth_year = v_birth)
    ORDER BY (birth_year = v_birth) DESC NULLS LAST, created_at
    LIMIT 1;
  END IF;

  -- 3. near-identical name ("Fyodor Dostoyevsky" vs "Fyodor Dostoevsky") with the same birth year
  IF v_id IS NULL AND v_birth IS NOT NULL THEN
    SELECT id INTO v_id FROM authors
    WHERE birth_year = v_birth AND name_norm % v_norm AND similarity(name_norm, v_norm) > 0.6
    ORDER BY similarity(name_norm, v_norm) DESC
    LIMIT 1;
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO authors (slug, name, name_norm, birth_year, death_year, ol_key)
    VALUES (
      bv_slug(v_name) || coalesce('-' || v_birth, '') || CASE
        WHEN EXISTS (SELECT 1 FROM authors WHERE slug = bv_slug(v_name) || coalesce('-' || v_birth, ''))
        THEN '-' || substr(md5(random()::text), 1, 4) ELSE '' END,
      v_name, v_norm, v_birth, v_death, v_ol)
    RETURNING id INTO v_id;
  ELSE
    UPDATE authors SET
      birth_year = coalesce(birth_year, v_birth),
      death_year = coalesce(death_year, v_death),
      ol_key = coalesce(ol_key, v_ol),
      updated_at = now()
    WHERE id = v_id
      AND (birth_year IS NULL AND v_birth IS NOT NULL
        OR death_year IS NULL AND v_death IS NOT NULL
        OR ol_key IS NULL AND v_ol IS NOT NULL);
  END IF;

  RETURN v_id;
END
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION bv_ingest_work(doc jsonb) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_title text := trim(regexp_replace(coalesce(doc ->> 'title', ''), '\s*\$[a-z]\s*', ' ', 'g'));
  v_base text := bv_base_title(v_title);
  v_work uuid;
  v_author_norms text[];
  v_author_ids uuid[] := '{}';
  v_aid uuid;
  a jsonb;
  i int := 0;
  s text;
BEGIN
  IF v_base = '' THEN RETURN NULL; END IF;

  SELECT coalesce(array_agg(bv_norm(bv_display_name(x ->> 'name'))), '{}')
  INTO v_author_norms
  FROM jsonb_array_elements(coalesce(doc -> 'authors', '[]')) x;

  -- 1. any shared identifier (Gutenberg id, ISBN, OL work key, Google id, DOI) -> same work
  SELECT wi.work_id INTO v_work
  FROM jsonb_array_elements(coalesce(doc -> 'identifiers', '[]')) x
  JOIN work_identifiers wi ON wi.kind = x ->> 'kind' AND wi.value = x ->> 'value'
  LIMIT 1;

  -- 2. same base title + an overlapping (fuzzy) author name
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

  -- 3. new work
  IF v_work IS NULL THEN
    v_work := gen_random_uuid();
    INSERT INTO works (id, slug, title, title_norm, subtitle, description, first_published_year,
                       languages, cover_url, is_public_domain, popularity, enrich_level)
    VALUES (
      v_work,
      bv_slug(v_title) || '-' || left(replace(v_work::text, '-', ''), 6),
      v_title,
      bv_norm(v_title),
      nullif(doc ->> 'subtitle', ''),
      nullif(left(doc ->> 'description', 4000), ''),
      nullif(doc ->> 'firstPublishedYear', '')::smallint,
      ARRAY(SELECT jsonb_array_elements_text(coalesce(doc -> 'languages', '[]'))),
      nullif(doc ->> 'coverUrl', ''),
      coalesce((doc ->> 'isPublicDomain')::boolean, false),
      least(1000, greatest(0, coalesce((doc ->> 'popularity')::int, 0))),
      0
    );
  ELSE
    UPDATE works SET
      subtitle = coalesce(subtitle, nullif(doc ->> 'subtitle', '')),
      -- keep the longer, richer description
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
      enrich_level = greatest(enrich_level, 1),   -- seen in 2+ sources = cross-referenced
      updated_at = now()
    WHERE id = v_work;
  END IF;

  -- authors
  FOR a IN SELECT * FROM jsonb_array_elements(coalesce(doc -> 'authors', '[]')) LOOP
    v_aid := bv_upsert_author(a);
    IF v_aid IS NOT NULL THEN
      INSERT INTO work_authors (work_id, author_id, position)
      VALUES (v_work, v_aid, i) ON CONFLICT DO NOTHING;
      i := i + 1;
    END IF;
  END LOOP;

  -- identifiers (first writer wins; a clash means it already belongs to another work)
  INSERT INTO work_identifiers (kind, value, work_id)
  SELECT x ->> 'kind', x ->> 'value', v_work
  FROM jsonb_array_elements(coalesce(doc -> 'identifiers', '[]')) x
  WHERE coalesce(x ->> 'value', '') <> ''
  ON CONFLICT DO NOTHING;

  -- formats
  INSERT INTO work_formats (work_id, format, url, source)
  SELECT v_work, x ->> 'format', x ->> 'url', coalesce(x ->> 'source', doc ->> 'source', 'unknown')
  FROM jsonb_array_elements(coalesce(doc -> 'formats', '[]')) x
  WHERE x ->> 'format' IN ('epub', 'pdf', 'mobi', 'azw3', 'txt', 'html', 'audio')
    AND x ->> 'url' LIKE 'https://%'
  ON CONFLICT DO NOTHING;

  -- subjects: map through aliases; unknown strings are queued for Gemini as 'pending'
  FOR s IN
    SELECT DISTINCT bv_norm(x) FROM jsonb_array_elements_text(coalesce(doc -> 'subjects', '[]')) x
    WHERE length(bv_norm(x)) BETWEEN 3 AND 120
    LIMIT 25
  LOOP
    INSERT INTO subject_aliases (alias_norm, subject_id, decided_by)
    VALUES (s, NULL, 'pending') ON CONFLICT DO NOTHING;
    INSERT INTO work_raw_subjects (work_id, alias_norm) VALUES (v_work, s) ON CONFLICT DO NOTHING;

    INSERT INTO work_subjects (work_id, subject_id)
    SELECT v_work, sa.subject_id FROM subject_aliases sa
    WHERE sa.alias_norm = s AND sa.subject_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN v_work;
END
$$;--> statement-breakpoint

-- Apply Gemini's subject classifications and re-tag every work that used that alias.
-- input: [{ "alias": "whaling fiction", "subject": "adventure" | null }]
CREATE OR REPLACE FUNCTION bv_apply_subject_aliases(items jsonb) RETURNS int
LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  UPDATE subject_aliases sa
  SET subject_id = (SELECT id FROM subjects WHERE slug = x ->> 'subject'),
      decided_by = 'gemini'
  FROM jsonb_array_elements(items) x
  WHERE sa.alias_norm = x ->> 'alias' AND sa.decided_by = 'pending';
  GET DIAGNOSTICS n = ROW_COUNT;

  INSERT INTO work_subjects (work_id, subject_id)
  SELECT DISTINCT wr.work_id, sa.subject_id
  FROM work_raw_subjects wr JOIN subject_aliases sa USING (alias_norm)
  WHERE sa.subject_id IS NOT NULL
    AND sa.alias_norm IN (SELECT x ->> 'alias' FROM jsonb_array_elements(items) x)
  ON CONFLICT DO NOTHING;

  RETURN n;
END
$$;--> statement-breakpoint

-- Atomically claim queue jobs (safe if two runs overlap).
CREATE OR REPLACE FUNCTION bv_claim_jobs(p_kind text, p_limit int) RETURNS SETOF ingest_queue
LANGUAGE sql AS $$
  UPDATE ingest_queue q
  SET attempts = q.attempts + 1,
      not_before = now() + make_interval(mins => 30 * (q.attempts + 1))
  WHERE q.id IN (
    SELECT id FROM ingest_queue
    WHERE (p_kind IS NULL OR kind = p_kind) AND not_before <= now() AND attempts < 4
    ORDER BY priority, created_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING q.*
$$;--> statement-breakpoint

-- Daily quota guard. Returns true and counts the call if still under the limit.
CREATE OR REPLACE FUNCTION bv_take_budget(p_service text, p_daily_limit int, p_cost int DEFAULT 1) RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE used int;
BEGIN
  INSERT INTO api_budget (day, service, calls) VALUES ((now() AT TIME ZONE 'America/Los_Angeles')::date, p_service, 0)
  ON CONFLICT DO NOTHING;
  UPDATE api_budget SET calls = calls + p_cost
  WHERE day = (now() AT TIME ZONE 'America/Los_Angeles')::date AND service = p_service AND calls + p_cost <= p_daily_limit
  RETURNING calls INTO used;
  -- keep only a week of history
  DELETE FROM api_budget WHERE day < current_date - 7;
  RETURN used IS NOT NULL;
END
$$;
