import { createFavoritesUseCase } from "~/server/usecase/favorites/create-favorites.use-case";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const dto = { ...body };

    return await createFavoritesUseCase(dto);
  }
  catch (e) {
    console.error("Error at API endpoint: ", e);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
