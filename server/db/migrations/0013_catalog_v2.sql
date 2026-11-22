-- Catalog v2: normalized works / authors / subjects / formats / identifiers.
-- Seeds from the old books_cache (Gutendex) so existing favorites survive, then drops it.

CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint

-- Immutable helpers (shared by the app, n8n and this migration)
CREATE OR REPLACE FUNCTION bv_norm(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT trim(regexp_replace(
           regexp_replace(lower(public.unaccent('public.unaccent'::regdictionary, coalesce(t, ''))), '[^a-z0-9]+', ' ', 'g'),
           '\s+', ' ', 'g'))
$$;--> statement-breakpoint

-- "Doyle, Arthur Conan (Arthur Ignatius Conan)" -> "Arthur Conan Doyle"
CREATE OR REPLACE FUNCTION bv_display_name(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE
    WHEN position(',' IN s) > 0
      THEN trim(substr(s, position(',' IN s) + 1)) || ' ' || trim(split_part(s, ',', 1))
    ELSE s END
  FROM (SELECT trim(regexp_replace(coalesce(t, ''), '\s*\(.*?\)', '', 'g')) AS s) x
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION bv_slug(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT left(replace(bv_norm(t), ' ', '-'), 80)
$$;--> statement-breakpoint

-- ---------------------------------------------------------------- tables
CREATE TABLE "works" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "title_norm" text NOT NULL,
  "subtitle" text,
  "description" text,
  "first_published_year" smallint,
  "languages" text[] DEFAULT '{}'::text[] NOT NULL,
  "cover_url" text,
  "is_public_domain" boolean DEFAULT false NOT NULL,
  "popularity" integer DEFAULT 0 NOT NULL,
  "enrich_level" smallint DEFAULT 0 NOT NULL,
  "search" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(subtitle, '')), 'B')) STORED,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "works_title_trgm_idx" ON "works" USING gin ("title_norm" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "works_search_idx" ON "works" USING gin ("search");--> statement-breakpoint
CREATE INDEX "works_popularity_idx" ON "works" ("popularity" DESC);--> statement-breakpoint
CREATE INDEX "works_title_norm_idx" ON "works" ("title_norm");--> statement-breakpoint

CREATE TABLE "authors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "name_norm" text NOT NULL,
  "birth_year" smallint,
  "death_year" smallint,
  "bio" text,
  "photo_url" text,
  "ol_key" text UNIQUE,
  "enrich_level" smallint DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "authors_name_trgm_idx" ON "authors" USING gin ("name_norm" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "authors_identity_idx" ON "authors" ("name_norm", coalesce("birth_year", -9999));--> statement-breakpoint

CREATE TABLE "work_authors" (
  "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE cascade,
  "author_id" uuid NOT NULL REFERENCES "authors"("id") ON DELETE cascade,
  "position" smallint DEFAULT 0 NOT NULL,
  "role" text DEFAULT 'author' NOT NULL,
  PRIMARY KEY ("work_id", "author_id")
);--> statement-breakpoint
CREATE INDEX "work_authors_author_idx" ON "work_authors" ("author_id");--> statement-breakpoint

CREATE TABLE "subjects" (
  "id" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "sort_order" smallint DEFAULT 100 NOT NULL,
  "show_on_home" boolean DEFAULT false NOT NULL
);--> statement-breakpoint

CREATE TABLE "subject_aliases" (
  "alias_norm" text PRIMARY KEY NOT NULL,
  "subject_id" smallint REFERENCES "subjects"("id") ON DELETE cascade,
  "decided_by" text DEFAULT 'rule' NOT NULL
);--> statement-breakpoint

CREATE TABLE "work_subjects" (
  "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE cascade,
  "subject_id" smallint NOT NULL REFERENCES "subjects"("id") ON DELETE cascade,
  PRIMARY KEY ("work_id", "subject_id")
);--> statement-breakpoint
CREATE INDEX "work_subjects_subject_idx" ON "work_subjects" ("subject_id", "work_id");--> statement-breakpoint

CREATE TABLE "work_formats" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE cascade,
  "format" text NOT NULL,
  "url" text NOT NULL,
  "source" text NOT NULL,
  CONSTRAINT "work_formats_unique" UNIQUE ("work_id", "format", "source")
);--> statement-breakpoint

CREATE TABLE "work_identifiers" (
  "kind" text NOT NULL,
  "value" text NOT NULL,
  "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE cascade,
  PRIMARY KEY ("kind", "value")
);--> statement-breakpoint
CREATE INDEX "work_identifiers_work_idx" ON "work_identifiers" ("work_id");--> statement-breakpoint

CREATE TABLE "ingest_queue" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "kind" text NOT NULL,
  "key" text NOT NULL UNIQUE,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "attempts" smallint DEFAULT 0 NOT NULL,
  "priority" smallint DEFAULT 5 NOT NULL,
  "not_before" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "ingest_queue_pick_idx" ON "ingest_queue" ("not_before", "priority");--> statement-breakpoint

CREATE TABLE "api_budget" (
  "day" date NOT NULL,
  "service" text NOT NULL,
  "calls" integer DEFAULT 0 NOT NULL,
  PRIMARY KEY ("day", "service")
);--> statement-breakpoint

-- ---------------------------------------------------------------- subjects
INSERT INTO subjects (slug, name, sort_order, show_on_home) VALUES
  ('fiction', 'Fiction', 10, true),
  ('adventure', 'Adventure', 20, true),
  ('fantasy', 'Fantasy', 30, true),
  ('science-fiction', 'Science Fiction', 40, true),
  ('mystery', 'Mystery & Detective', 50, true),
  ('romance', 'Romance', 60, true),
  ('horror', 'Horror & Gothic', 70, false),
  ('historical-fiction', 'Historical Fiction', 80, false),
  ('childrens', 'Children''s', 90, false),
  ('short-stories', 'Short Stories', 100, false),
  ('poetry', 'Poetry', 110, false),
  ('drama', 'Drama & Plays', 120, false),
  ('humor', 'Humor', 130, false),
  ('philosophy', 'Philosophy', 140, false),
  ('religion', 'Religion & Spirituality', 150, false),
  ('history', 'History', 160, false),
  ('biography', 'Biography & Memoir', 170, false),
  ('science', 'Science & Nature', 180, false),
  ('politics', 'Politics & Society', 190, false),
  ('travel', 'Travel', 200, false),
  ('self-help', 'Self-Help', 210, false),
  ('business', 'Business & Economics', 220, false),
  ('art', 'Art & Music', 230, false),
  ('cooking', 'Cooking', 240, false);--> statement-breakpoint

-- ---------------------------------------------------------------- seed from books_cache
CREATE TEMP TABLE _seed AS
SELECT
  b.id AS old_id,
  gen_random_uuid() AS work_id,
  b.external_book_id,
  b.title,
  bv_norm(b.title) AS title_norm,
  b.summary[1] AS description,
  coalesce(b.language, '{}') AS languages,
  b.cover_url,
  coalesce(b.source_download_count, 0) AS dl,
  b.author,
  b.subjects,
  b.download_links
FROM books_cache b
WHERE b.title IS NOT NULL;--> statement-breakpoint

INSERT INTO works (id, slug, title, title_norm, description, languages, cover_url, is_public_domain, popularity)
SELECT work_id,
       bv_slug(title) || '-' || left(replace(work_id::text, '-', ''), 6),
       title, title_norm, description, languages, cover_url, true,
       least(1000, round(ln(1 + dl) * 70))::int
FROM _seed;--> statement-breakpoint

INSERT INTO work_identifiers (kind, value, work_id)
SELECT 'gutenberg', external_book_id, work_id FROM _seed WHERE external_book_id IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint

INSERT INTO work_formats (work_id, format, url, source)
SELECT s.work_id, f.format, f.url, 'gutenberg'
FROM _seed s
CROSS JOIN LATERAL (VALUES
  ('epub', s.download_links ->> 'epub'),
  ('mobi', s.download_links ->> 'mobi'),
  ('txt',  s.download_links ->> 'text'),
  ('html', s.download_links ->> 'html')
) AS f(format, url)
WHERE f.url IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint

CREATE TEMP TABLE _seed_authors AS
SELECT DISTINCT ON (s.work_id, bv_norm(bv_display_name(a ->> 'name')))
  s.work_id,
  a.ord - 1 AS position,
  bv_display_name(a ->> 'name') AS name,
  bv_norm(bv_display_name(a ->> 'name')) AS name_norm,
  nullif(a ->> 'birthYear', '')::smallint AS birth_year,
  nullif(a ->> 'deathYear', '')::smallint AS death_year
FROM _seed s
CROSS JOIN LATERAL jsonb_array_elements(coalesce(s.author, '[]'::jsonb)) WITH ORDINALITY AS a(a, ord)
WHERE coalesce(a ->> 'name', '') <> '';--> statement-breakpoint

INSERT INTO authors (slug, name, name_norm, birth_year, death_year)
SELECT DISTINCT ON (name_norm, coalesce(birth_year, -9999))
  bv_slug(name) || coalesce('-' || birth_year, ''), name, name_norm, birth_year, death_year
FROM _seed_authors
ORDER BY name_norm, coalesce(birth_year, -9999), death_year NULLS LAST
ON CONFLICT DO NOTHING;--> statement-breakpoint

INSERT INTO work_authors (work_id, author_id, position)
SELECT sa.work_id, a.id, sa.position
FROM _seed_authors sa
JOIN authors a ON a.name_norm = sa.name_norm AND coalesce(a.birth_year, -9999) = coalesce(sa.birth_year, -9999)
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Rule-based subject aliases for Gutenberg's Library-of-Congress style subjects
CREATE TEMP TABLE _raw_subjects AS
SELECT DISTINCT s.work_id, bv_norm(x) AS alias_norm
FROM _seed s
CROSS JOIN LATERAL jsonb_array_elements_text(coalesce(s.subjects, '[]'::jsonb)) AS x;--> statement-breakpoint

INSERT INTO subject_aliases (alias_norm, subject_id)
SELECT r.alias_norm, (
  SELECT id FROM subjects WHERE slug = CASE
    WHEN r.alias_norm ~ '(science fiction|time travel|space|robots|extraterrestrial|interplanetary)' THEN 'science-fiction'
    WHEN r.alias_norm ~ '(detective|mystery|crime|murder|police)' THEN 'mystery'
    WHEN r.alias_norm ~ '(fantasy|fairy tales|magic|dragons|mythology|legends)' THEN 'fantasy'
    WHEN r.alias_norm ~ '(horror|ghost|gothic|vampire|supernatural)' THEN 'horror'
    WHEN r.alias_norm ~ '(love stories|romance|courtship|man woman relationships|marriage)' THEN 'romance'
    WHEN r.alias_norm ~ '(adventure|sea stories|voyages|pirates|survival|shipwrecks)' THEN 'adventure'
    WHEN r.alias_norm ~ '(historical fiction|war stories)' THEN 'historical-fiction'
    WHEN r.alias_norm ~ '(juvenile|children|nursery)' THEN 'childrens'
    WHEN r.alias_norm ~ '(short stories)' THEN 'short-stories'
    WHEN r.alias_norm ~ '(poetry|poems|sonnets|verse)' THEN 'poetry'
    WHEN r.alias_norm ~ '(drama|plays|tragedies|comedies)' THEN 'drama'
    WHEN r.alias_norm ~ '(humor|satire|wit and humor)' THEN 'humor'
    WHEN r.alias_norm ~ '(philosophy|ethics)' THEN 'philosophy'
    WHEN r.alias_norm ~ '(religion|bible|christian|theology|spiritual)' THEN 'religion'
    WHEN r.alias_norm ~ '(biography|autobiography|memoir|diaries|correspondence)' THEN 'biography'
    WHEN r.alias_norm ~ '(history|civilization)' THEN 'history'
    WHEN r.alias_norm ~ '(science|natural history|evolution|physics|biology|astronomy)' THEN 'science'
    WHEN r.alias_norm ~ '(politic|economics|social|government)' THEN 'politics'
    WHEN r.alias_norm ~ '(travel|description and travel)' THEN 'travel'
    WHEN r.alias_norm ~ '(fiction|novel)' THEN 'fiction'
  END)
FROM (SELECT DISTINCT alias_norm FROM _raw_subjects) r
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Unmatched aliases stay as NULL with decided_by='pending' so n8n/Gemini can classify them later
UPDATE subject_aliases SET decided_by = 'pending' WHERE subject_id IS NULL;--> statement-breakpoint

INSERT INTO work_subjects (work_id, subject_id)
SELECT DISTINCT r.work_id, sa.subject_id
FROM _raw_subjects r JOIN subject_aliases sa USING (alias_norm)
WHERE sa.subject_id IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Every Gutenberg "Fiction" sub-genre also counts as Fiction
INSERT INTO work_subjects (work_id, subject_id)
SELECT DISTINCT ws.work_id, (SELECT id FROM subjects WHERE slug = 'fiction')
FROM work_subjects ws JOIN subjects s ON s.id = ws.subject_id
WHERE s.slug IN ('adventure', 'fantasy', 'science-fiction', 'mystery', 'romance', 'horror', 'historical-fiction', 'short-stories')
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- ---------------------------------------------------------------- user tables -> work_id
ALTER TABLE "favorites" ADD COLUMN "work_id" uuid;--> statement-breakpoint
UPDATE favorites f SET work_id = s.work_id FROM _seed s WHERE f.book_id = s.old_id::text;--> statement-breakpoint
DELETE FROM favorites WHERE work_id IS NULL OR profile_id IS NULL;--> statement-breakpoint
DELETE FROM favorites a USING favorites b WHERE a.ctid < b.ctid AND a.profile_id = b.profile_id AND a.work_id = b.work_id;--> statement-breakpoint
ALTER TABLE "favorites" DROP CONSTRAINT IF EXISTS "favorites_profile_id_fkey";--> statement-breakpoint
ALTER TABLE "favorites" DROP COLUMN "book_id", DROP COLUMN "source";--> statement-breakpoint
ALTER TABLE "favorites" ALTER COLUMN "work_id" SET NOT NULL, ALTER COLUMN "profile_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_profile_work_unique" UNIQUE ("profile_id", "work_id");--> statement-breakpoint

-- These were always empty: rebuild cleanly
DROP TABLE "shelf_books";--> statement-breakpoint
DROP TABLE "shelves";--> statement-breakpoint
DROP TABLE "reading_status";--> statement-breakpoint
DROP TABLE "reviews";--> statement-breakpoint

CREATE TABLE "reading_status" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" uuid NOT NULL REFERENCES "profile"("id") ON DELETE cascade,
  "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE cascade,
  "status" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "reading_status_profile_work_unique" UNIQUE ("profile_id", "work_id")
);--> statement-breakpoint
CREATE TABLE "shelves" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" uuid NOT NULL REFERENCES "profile"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "description" text,
  "is_public" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint
CREATE TABLE "shelf_books" (
  "shelf_id" uuid NOT NULL REFERENCES "shelves"("id") ON DELETE cascade,
  "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE cascade,
  "added_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("shelf_id", "work_id")
);--> statement-breakpoint
CREATE TABLE "reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" uuid NOT NULL REFERENCES "profile"("id") ON DELETE cascade,
  "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE cascade,
  "rating" numeric(2, 1),
  "review_text" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "reviews_profile_work_unique" UNIQUE ("profile_id", "work_id")
);--> statement-breakpoint

DROP TABLE "books_cache";
