import { getBooksByIdUseCase } from "~/server/usecase/book/get-books-by-id.use-case";

export default defineEventHandler(async (event) => {
  try {
    const { ids } = getQuery(event);

    const bookIds = Array.isArray(ids) ? ids : [ids];

    return await getBooksByIdUseCase(bookIds);
  }
  catch (e) {
    console.error("Error at API endpoint: ", e);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
