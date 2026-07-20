import { and, eq } from "drizzle-orm";

import type { CreateFavoritesDTO, ValidateFavoritesDTO } from "~/shared/dto";

import db from "../db";
import { favorites } from "../db/schema";

async function createFavorites(dto: CreateFavoritesDTO) {
  const values = {
    profileId: dto.profileId,
    bookId: dto.bookId,
    source: dto.source,
  };

  await db
    .insert(favorites)
    .values(values);

  return true;
}

async function checkIfFavoriteByBookId(dto: ValidateFavoritesDTO) {
  const result = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.bookId, dto.bookId), eq(favorites.profileId, dto.profileId)));

  return result;
}

async function deleteFavoritesById(dto: ValidateFavoritesDTO) {
  await db
    .delete(favorites)
    .where(and(eq(favorites.bookId, dto.bookId), eq(favorites.profileId, dto.profileId)));

  return true;
}

async function fetchFavoriteBooksByProfileId(profileId: string) {
  const result = await db
    .select()
    .from(favorites)
    .where(eq(favorites.profileId, profileId));

  return result;
}

export const favoritesService = {
  createFavorites,
  checkIfFavoriteByBookId,
  deleteFavoritesById,
  fetchFavoriteBooksByProfileId,
};
