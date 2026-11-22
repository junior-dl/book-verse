import type { H3Event } from "h3";

import { favoritesService } from "~/server/services/favorites.service";
import { FavoriteDTOSchema } from "~/shared/dto";

async function requireProfileId(event: H3Event) {
  const user = await requireUser(event);
  const profileId = await favoritesService.getProfileIdForUser(user.id);
  if (!profileId)
    notFound("Profile not found");
  return profileId!;
}

export async function addFavoriteUseCase(event: H3Event, body: unknown) {
  const { workId } = validate(FavoriteDTOSchema, body);
  return favoritesService.add(await requireProfileId(event), workId);
}

export async function removeFavoriteUseCase(event: H3Event, body: unknown) {
  const { workId } = validate(FavoriteDTOSchema, body);
  return favoritesService.remove(await requireProfileId(event), workId);
}

export async function isFavoriteUseCase(event: H3Event, query: unknown) {
  const { workId } = validate(FavoriteDTOSchema, query);
  return { isFavorite: await favoritesService.isFavorite(await requireProfileId(event), workId) };
}

export function listFavoriteBooksUseCase(profileId: string) {
  return favoritesService.listBooks(profileId);
}
