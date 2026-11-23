import type { SQL } from "drizzle-orm";

import { sql } from "drizzle-orm";

import type { CreateShelfDTO, UpdateShelfDTO } from "~/shared/dto";
import type { BookCard, ShelfDetail, ShelfForBook, ShelfSummary } from "~/shared/types";

import db from "../db";

const MAX_SHELVES = 50;
const MAX_BOOKS_PER_SHELF = 1000;

async function rows<T>(query: SQL): Promise<T[]> {
  return (await db.execute(query)).rows as T[];
}

const summaryColumns = sql`
  s.id, s.name, s.description, s.is_public AS "isPublic", s.updated_at AS "updatedAt",
  (SELECT count(*)::int FROM shelf_books sb WHERE sb.shelf_id = s.id) AS "bookCount",
  coalesce((
    SELECT json_agg(c) FROM (
      SELECT w.title, w.cover_url AS "coverUrl"
      FROM shelf_books sb JOIN works w ON w.id = sb.work_id
      WHERE sb.shelf_id = s.id
      ORDER BY sb.added_at DESC
      LIMIT 4
    ) c
  ), '[]'::json) AS covers
`;

async function listMine(profileId: string): Promise<ShelfSummary[]> {
  return rows<ShelfSummary>(sql`
    SELECT ${summaryColumns} FROM shelves s
    WHERE s.profile_id = ${profileId}
    ORDER BY s.updated_at DESC
  `);
}

async function create(profileId: string, dto: CreateShelfDTO) {
  const [count] = await rows<{ n: number }>(sql`SELECT count(*)::int AS n FROM shelves WHERE profile_id = ${profileId}`);
  if ((count?.n ?? 0) >= MAX_SHELVES)
    return { ok: false as const, reason: `You can have up to ${MAX_SHELVES} shelves` };

  const [shelf] = await rows<{ id: string }>(sql`
    INSERT INTO shelves (profile_id, name, description, is_public)
    VALUES (${profileId}, ${dto.name}, ${dto.description ?? null}, ${dto.isPublic ?? false})
    RETURNING id
  `);
  return { ok: true as const, id: shelf!.id };
}

/** Owner sees any of their shelves; anyone else only public ones. */
async function get(shelfId: string, viewerProfileId: string | null): Promise<ShelfDetail | null> {
  const [shelf] = await rows<ShelfSummary & { profileId: string }>(sql`
    SELECT ${summaryColumns}, s.profile_id AS "profileId" FROM shelves s WHERE s.id = ${shelfId}
  `);
  if (!shelf)
    return null;

  const isOwner = shelf.profileId === viewerProfileId;
  if (!isOwner && !shelf.isPublic)
    return null;

  const books = await rows<BookCard>(sql`
    SELECT w.id, w.slug, w.title, w.cover_url AS "coverUrl", w.is_public_domain AS "isPublicDomain",
      coalesce((
        SELECT json_agg(json_build_object('slug', a.slug, 'name', a.name) ORDER BY wa.position)
        FROM work_authors wa JOIN authors a ON a.id = wa.author_id WHERE wa.work_id = w.id
      ), '[]'::json) AS authors
    FROM shelf_books sb JOIN works w ON w.id = sb.work_id
    WHERE sb.shelf_id = ${shelfId}
    ORDER BY sb.added_at DESC
  `);

  const { profileId: _p, ...summary } = shelf;
  return { ...summary, isOwner, books };
}

async function isOwner(shelfId: string, profileId: string) {
  const [row] = await rows<{ ok: boolean }>(sql`
    SELECT true AS ok FROM shelves WHERE id = ${shelfId} AND profile_id = ${profileId}
  `);
  return !!row;
}

async function update(shelfId: string, profileId: string, dto: UpdateShelfDTO) {
  const updated = await rows<{ id: string }>(sql`
    UPDATE shelves SET
      name = coalesce(${dto.name ?? null}, name),
      description = CASE WHEN ${dto.description !== undefined} THEN ${dto.description ?? null} ELSE description END,
      is_public = coalesce(${dto.isPublic ?? null}, is_public),
      updated_at = now()
    WHERE id = ${shelfId} AND profile_id = ${profileId}
    RETURNING id
  `);
  return updated.length > 0;
}

async function remove(shelfId: string, profileId: string) {
  const deleted = await rows<{ id: string }>(sql`
    DELETE FROM shelves WHERE id = ${shelfId} AND profile_id = ${profileId} RETURNING id
  `);
  return deleted.length > 0;
}

async function addBook(shelfId: string, profileId: string, workId: string) {
  if (!(await isOwner(shelfId, profileId)))
    return { ok: false as const, reason: "Shelf not found" };

  const [count] = await rows<{ n: number }>(sql`SELECT count(*)::int AS n FROM shelf_books WHERE shelf_id = ${shelfId}`);
  if ((count?.n ?? 0) >= MAX_BOOKS_PER_SHELF)
    return { ok: false as const, reason: `A shelf holds up to ${MAX_BOOKS_PER_SHELF} books` };

  await db.execute(sql`
    INSERT INTO shelf_books (shelf_id, work_id)
    SELECT ${shelfId}, id FROM works WHERE id = ${workId}
    ON CONFLICT DO NOTHING
  `);
  await db.execute(sql`UPDATE shelves SET updated_at = now() WHERE id = ${shelfId}`);
  return { ok: true as const };
}

async function removeBook(shelfId: string, profileId: string, workId: string) {
  if (!(await isOwner(shelfId, profileId)))
    return false;
  await db.execute(sql`DELETE FROM shelf_books WHERE shelf_id = ${shelfId} AND work_id = ${workId}`);
  await db.execute(sql`UPDATE shelves SET updated_at = now() WHERE id = ${shelfId}`);
  return true;
}

async function forBook(profileId: string, workId: string): Promise<ShelfForBook[]> {
  return rows<ShelfForBook>(sql`
    SELECT s.id, s.name,
      EXISTS (SELECT 1 FROM shelf_books sb WHERE sb.shelf_id = s.id AND sb.work_id = ${workId}) AS "hasBook"
    FROM shelves s
    WHERE s.profile_id = ${profileId}
    ORDER BY s.name
  `);
}

export const shelvesService = { listMine, create, get, update, remove, addBook, removeBook, forBook };
