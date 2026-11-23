import type { SQL } from "drizzle-orm";

import { sql } from "drizzle-orm";

import type { AuthorPage, Book, BookCard, HomeFeed, Paged } from "~/shared/types";

import db from "../db";

/**
 * Read-only catalog queries. Everything here hits Neon only — providers are
 * fetched in the background by the n8n companion, never during a page load.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Columns for a BookCard, given a `works` alias `w`. */
const cardColumns = sql`
  w.id,
  w.slug,
  w.title,
  w.cover_url AS "coverUrl",
  w.is_public_domain AS "isPublicDomain",
  coalesce((
    SELECT json_agg(json_build_object('slug', a.slug, 'name', a.name) ORDER BY wa.position)
    FROM work_authors wa JOIN authors a ON a.id = wa.author_id
    WHERE wa.work_id = w.id
  ), '[]'::json) AS authors
`;

async function rows<T>(query: SQL): Promise<T[]> {
  const result = await db.execute(query);
  return result.rows as T[];
}

async function getHome(perSection: number, trendingCount: number): Promise<HomeFeed> {
  // One round-trip for the whole home page.
  const [feed] = await rows<HomeFeed>(sql`
    SELECT
      (
        SELECT coalesce(json_agg(t), '[]'::json) FROM (
          SELECT ${cardColumns}, w.description
          FROM works w
          WHERE w.cover_url IS NOT NULL
          ORDER BY w.popularity DESC
          LIMIT ${trendingCount}
        ) t
      ) AS trending,
      (
        SELECT coalesce(json_agg(s ORDER BY s.sort_order), '[]'::json) FROM (
          SELECT sub.slug, sub.name, sub.sort_order,
            (
              SELECT coalesce(json_agg(b), '[]'::json) FROM (
                SELECT ${cardColumns}
                FROM work_subjects ws JOIN works w ON w.id = ws.work_id
                WHERE ws.subject_id = sub.id
                ORDER BY w.popularity DESC
                LIMIT ${perSection}
              ) b
            ) AS books
          FROM subjects sub
          WHERE sub.show_on_home
        ) s
      ) AS sections
  `);

  return {
    trending: feed?.trending ?? [],
    sections: (feed?.sections ?? []).filter(s => s.books.length > 0),
  };
}

async function getBook(idOrSlug: string): Promise<Book | null> {
  const where = UUID_RE.test(idOrSlug) ? sql`w.id = ${idOrSlug}::uuid` : sql`w.slug = ${idOrSlug}`;

  const [book] = await rows<Book>(sql`
    SELECT ${cardColumns},
      w.subtitle,
      w.description,
      w.first_published_year AS "firstPublishedYear",
      w.languages,
      w.popularity,
      coalesce((
        SELECT json_agg(json_build_object('slug', s.slug, 'name', s.name) ORDER BY s.sort_order)
        FROM work_subjects ws JOIN subjects s ON s.id = ws.subject_id WHERE ws.work_id = w.id
      ), '[]'::json) AS subjects,
      coalesce((
        SELECT json_agg(json_build_object('format', f.format, 'url', f.url, 'source', f.source) ORDER BY f.format)
        FROM work_formats f WHERE f.work_id = w.id
      ), '[]'::json) AS formats,
      coalesce((
        SELECT json_agg(json_build_object('kind', i.kind, 'value', i.value))
        FROM work_identifiers i WHERE i.work_id = w.id
      ), '[]'::json) AS identifiers
    FROM works w
    WHERE ${where}
    LIMIT 1
  `);

  return book ?? null;
}

/**
 * Typo-tolerant search over titles and author names.
 * - full-text match on title/subtitle
 * - trigram word-similarity on normalized title ("dune" ~ "Dune Messiah")
 * - trigram similarity on normalized author name ("dostoyevsky" ~ "dostoevsky")
 */
async function searchBooks(query: string, page: number, pageSize: number): Promise<Paged<BookCard>> {
  const offset = (page - 1) * pageSize;

  const result = await rows<BookCard & { total: number }>(sql`
    WITH q AS (SELECT bv_norm(${query}) AS nq, websearch_to_tsquery('simple', ${query}) AS tsq),
    hits AS (
      SELECT w.id,
        greatest(
          CASE WHEN w.search @@ q.tsq THEN 1.0 ELSE 0 END,
          word_similarity(q.nq, w.title_norm),
          coalesce((
            SELECT max(similarity(a.name_norm, q.nq))
            FROM work_authors wa JOIN authors a ON a.id = wa.author_id
            WHERE wa.work_id = w.id
          ), 0)
        ) AS score
      FROM works w, q
      WHERE w.search @@ q.tsq
         OR q.nq <% w.title_norm
         OR w.id IN (
           SELECT wa.work_id FROM authors a JOIN work_authors wa ON wa.author_id = a.id
           WHERE a.name_norm % q.nq OR q.nq <% a.name_norm
         )
    )
    SELECT ${cardColumns}, count(*) OVER()::int AS total
    FROM hits h JOIN works w ON w.id = h.id
    ORDER BY h.score DESC, w.popularity DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const total = result[0]?.total ?? 0;

  // Not enough local results -> ask the n8n companion to look it up later.
  if (page === 1 && total < 5)
    await enqueue("search", query, { q: query });

  return {
    items: result.map(({ total: _t, ...card }) => card),
    page,
    pageSize,
    total,
  };
}

async function getSubjectBooks(slug: string, page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;

  const [subject] = await rows<{ slug: string; name: string }>(sql`
    SELECT slug, name FROM subjects WHERE slug = ${slug} LIMIT 1
  `);

  if (!subject)
    return null;

  const items = await rows<BookCard & { total: number }>(sql`
    SELECT ${cardColumns}, count(*) OVER()::int AS total
    FROM subjects s
    JOIN work_subjects ws ON ws.subject_id = s.id
    JOIN works w ON w.id = ws.work_id
    WHERE s.slug = ${slug}
    ORDER BY w.popularity DESC, w.title
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  return {
    subject,
    items: items.map(({ total: _t, ...card }) => card),
    page,
    pageSize,
    total: items[0]?.total ?? 0,
  };
}

async function listSubjects() {
  return rows<{ slug: string; name: string; count: number }>(sql`
    SELECT s.slug, s.name, count(ws.work_id)::int AS count
    FROM subjects s LEFT JOIN work_subjects ws ON ws.subject_id = s.id
    GROUP BY s.id ORDER BY s.sort_order
  `);
}

async function getAuthor(slug: string): Promise<AuthorPage | null> {
  const [author] = await rows<AuthorPage>(sql`
    SELECT a.id, a.slug, a.name,
      a.birth_year AS "birthYear", a.death_year AS "deathYear",
      a.bio, a.photo_url AS "photoUrl",
      coalesce((
        SELECT json_agg(b) FROM (
          SELECT ${cardColumns}
          FROM work_authors wa2 JOIN works w ON w.id = wa2.work_id
          WHERE wa2.author_id = a.id
          ORDER BY w.popularity DESC
        ) b
      ), '[]'::json) AS books
    FROM authors a
    WHERE a.slug = ${slug}
    LIMIT 1
  `);

  if (author && author.bio === null)
    await enqueue("author", author.id, { authorId: author.id, name: author.name });

  return author ?? null;
}

async function getBooksByIds(ids: string[]): Promise<BookCard[]> {
  if (ids.length === 0)
    return [];

  // Pass each id as its own parameter: an array interpolated into sql`` expands to ($1, $2, …),
  // which is not a valid uuid[] literal and made every favorites request fail.
  const idList = sql.join(ids.map(id => sql`${id}::uuid`), sql`, `);
  return rows<BookCard>(sql`
    SELECT ${cardColumns}
    FROM works w
    WHERE w.id IN (${idList})
  `);
}

/** Ask n8n to do background work. Deduped by key; the queue is capped so it can't grow unbounded. */
async function enqueue(kind: "search" | "work" | "author", key: string, payload: Record<string, unknown>, priority = 5) {
  try {
    await db.execute(sql`
      INSERT INTO ingest_queue (kind, key, payload, priority)
      SELECT ${kind}, ${`${kind}:${key.toLowerCase().trim()}`}, ${JSON.stringify(payload)}::jsonb, ${priority}
      WHERE (SELECT count(*) FROM ingest_queue) < 500
      ON CONFLICT (key) DO NOTHING
    `);
  }
  catch (e) {
    // Never fail a page because the queue is unavailable.
    console.error("Failed to enqueue background job", e);
  }
}

export const catalogService = {
  getHome,
  getBook,
  searchBooks,
  getSubjectBooks,
  listSubjects,
  getAuthor,
  getBooksByIds,
  enqueue,
};
