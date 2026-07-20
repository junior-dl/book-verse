import type { CreateFavoritesDTO } from "~/shared/dto";

import { favoritesService } from "~/server/services/favorites.service";

export async function createFavoritesUseCase(dto: CreateFavoritesDTO) {
  try {
    return await favoritesService.createFavorites(dto);
  }
  catch (e) {
    console.error("Error in creating favorites: ", e);
  }
}
