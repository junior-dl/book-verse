import { deleteFavoritesUseCase } from "~/server/usecase/favorites/delete-favorites.use-case";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const dto = { ...body };

    return await deleteFavoritesUseCase(dto);
  }
  catch (e) {
    console.error("Error at API endpoint: ", e);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
