import { and, desc, eq } from "drizzle-orm";

import db from "../db";
import { favorites, profile } from "../db/schema";
import { catalogService } from "./catalog.service";

async function getProfileIdForUser(authUserId: string) {
  const [row] = await db.select({ id: profile.id }).from(profile).where(eq(profile.authUserId, authUserId));
  return row?.id ?? null;
}

async function add(profileId: string, workId: string) {
  await db.insert(favorites).values({ profileId, workId }).onConflictDoNothing();
  return true;
}

async function remove(profileId: string, workId: string) {
  await db.delete(favorites).where(and(eq(favorites.profileId, profileId), eq(favorites.workId, workId)));
  return true;
}

async function isFavorite(profileId: string, workId: string) {
  const rows = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.profileId, profileId), eq(favorites.workId, workId)))
    .limit(1);
  return rows.length > 0;
}

async function listBooks(profileId: string) {
  const rows = await db
    .select({ workId: favorites.workId })
    .from(favorites)
    .where(eq(favorites.profileId, profileId))
    .orderBy(desc(favorites.createdAt));

  const ids = rows.map(r => r.workId);
  const books = await catalogService.getBooksByIds(ids);
  const byId = new Map(books.map(b => [b.id, b]));
  return ids.map(id => byId.get(id)).filter(b => b !== undefined);
}

export const favoritesService = { getProfileIdForUser, add, remove, isFavorite, listBooks };
