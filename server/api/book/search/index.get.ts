import { searchBookUseCase } from "~/server/usecase/book/search-book.use-case";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event).q as string;

    if (!query) {
      throw createError({
        statusCode: 400,
        statusMessage: "Query is required",
      });
    }

    const result = await searchBookUseCase(query);

    return result;
  }
  catch (e) {
    console.error("Error at API endpoint: ", e);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
