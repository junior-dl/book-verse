import type { ValidateFavoritesDTO } from "~/shared/dto";

import { favoritesService } from "~/server/services/favorites.service";

export async function deleteFavoritesUseCase(dto: ValidateFavoritesDTO) {
  try {
    return await favoritesService.deleteFavoritesById(dto);
  }
  catch (e) {
    console.error("Error in deleting favorite: ", e);
  }
}
