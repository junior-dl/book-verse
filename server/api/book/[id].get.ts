import { getBookByIdUseCase } from "~/server/usecase/book/get-book-by-id.use-case";

export default defineEventHandler(async (event) => {
  try {
    const params = getRouterParams(event);
    const bookId = params.id;

    if (!bookId) {
      console.error("Book ID is required to get Book Details.");
      return;
    }

    return await getBookByIdUseCase(bookId);
  }
  catch (e) {
    console.error("Error at API endpoing: ", e);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
