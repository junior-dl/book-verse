import { fetchFavoriteBooksByProfileIdUseCase } from "~/server/usecase/favorites/fetch-favorite-books-by-id.use-case";

export default defineEventHandler(async (event) => {
  try {
    const params = getRouterParams(event);
    const profileId = params.id;

    if (!profileId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Profile ID is required",
      });
    }

    return await fetchFavoriteBooksByProfileIdUseCase(profileId);
  }
  catch (e) {
    console.error("Error at API endpoint: ", e);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
