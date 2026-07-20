import { favoritesService } from "~/server/services/favorites.service";

export async function fetchFavoriteBooksByProfileIdUseCase(profileId: string) {
  try {
    return await favoritesService.fetchFavoriteBooksByProfileId(profileId);
  }
  catch (e) {
    console.error("Error in fetching favorites: ", e);
  }
}
