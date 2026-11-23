import { sql } from "drizzle-orm";

import type { DataFlag, FlagAction } from "~/shared/types";

import db from "../db";

async function listOpen(): Promise<DataFlag[]> {
  const result = await db.execute(sql`
    SELECT f.id::int AS id, f.kind, f.detail, f.created_at AS "createdAt",
      json_build_object('id', w.id, 'slug', w.slug, 'title', w.title) AS work,
      coalesce((
        SELECT json_agg(json_build_object('id', a2.id, 'slug', a2.slug, 'name', a2.name) ORDER BY wa.position)
        FROM work_authors wa JOIN authors a2 ON a2.id = wa.author_id WHERE wa.work_id = w.id
      ), '[]'::json) AS "workAuthors",
      CASE WHEN a.id IS NULL THEN NULL ELSE json_build_object('id', a.id, 'slug', a.slug, 'name', a.name) END AS author,
      CASE WHEN o.id IS NULL THEN NULL ELSE json_build_object('id', o.id, 'slug', o.slug, 'title', o.title) END AS "otherWork"
    FROM data_flags f
    JOIN works w ON w.id = f.work_id
    LEFT JOIN authors a ON a.id = f.author_id
    LEFT JOIN works o ON o.id = f.other_work_id
    WHERE f.status = 'open'
    ORDER BY f.created_at DESC
    LIMIT 200
  `);
  return result.rows as DataFlag[];
}

/**
 * Resolve one flag. Every action is something a person chose; nothing here runs automatically.
 * - dismiss: the data is fine, stop flagging it
 * - remove_author: unlink the flagged author (or, for a 3+ author flag, the author picked) from the book
 * - merge: merge the two flagged books into the more popular one
 */
async function resolve(id: number, action: FlagAction, authorId?: string) {
  const [flag] = (await db.execute(sql`
    SELECT kind, work_id AS "workId", author_id AS "authorId", other_work_id AS "otherWorkId"
    FROM data_flags WHERE id = ${id} AND status = 'open'
  `)).rows as { kind: string; workId: string; authorId: string | null; otherWorkId: string | null }[];

  if (!flag)
    return { ok: false, reason: "Flag not found or already resolved" };

  if (action === "remove_author") {
    const target = flag.authorId ?? authorId;
    if (!target)
      return { ok: false, reason: "Pick which author to remove" };

    const removed = await db.execute(sql`
      DELETE FROM work_authors WHERE work_id = ${flag.workId} AND author_id = ${target} RETURNING 1
    `);
    if (removed.rows.length === 0)
      return { ok: false, reason: "That author is not on this book" };

    // A 3+ author flag stays open until the book is under 3 authors, so several can be removed.
    if (flag.kind === "many_authors") {
      const [row] = (await db.execute(sql`SELECT count(*)::int AS n FROM work_authors WHERE work_id = ${flag.workId}`)).rows as { n: number }[];
      if ((row?.n ?? 0) >= 3)
        return { ok: true, stillOpen: true };
    }
  }

  if (action === "merge") {
    if (!flag.otherWorkId)
      return { ok: false, reason: "This flag has no second book to merge" };
    await db.execute(sql`
      SELECT bv_merge_works(k.id, d.id)
      FROM (SELECT id, popularity FROM works WHERE id IN (${flag.workId}, ${flag.otherWorkId})) k
      JOIN (SELECT id, popularity FROM works WHERE id IN (${flag.workId}, ${flag.otherWorkId})) d ON d.id <> k.id
      WHERE (k.popularity, k.id) > (d.popularity, d.id)
    `);
  }

  await db.execute(sql`
    UPDATE data_flags SET status = ${action === "dismiss" ? "dismissed" : "fixed"}, resolved_at = now()
    WHERE id = ${id}
  `);
  return { ok: true };
}

async function scanNow() {
  const result = await db.execute(sql`SELECT * FROM bv_scan_health()`);
  return result.rows[0];
}

export const healthService = { listOpen, resolve, scanNow };
