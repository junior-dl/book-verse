import { checkIfFavoriteByBookIdUseCase } from "~/server/usecase/favorites/check-if-favorite-by-book-id.use-case";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery<{ bookId: string; profileId: string }>(event);
    const bookId = query.bookId;
    const profileId = query.profileId;

    if (!bookId || !profileId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Book ID is required to validate favorites",
      });
    }

    return await checkIfFavoriteByBookIdUseCase(bookId, profileId);
  }
  catch (e) {
    console.error("Error at API endpoint: ", e);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
