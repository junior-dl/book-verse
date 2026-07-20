import { favoritesService } from "~/server/services/favorites.service";

export async function checkIfFavoriteByBookIdUseCase(bookId: string, profileId: string) {
  try {
    const data = { bookId, profileId };
    return await favoritesService.checkIfFavoriteByBookId(data);
  }
  catch (e) {
    console.error("Error in validating favorite: ", e);
  }
}
