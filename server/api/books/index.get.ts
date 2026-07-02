import { getBooksUseCase } from "~/server/usecase/book/get-books.use-case";

export default defineEventHandler(async (event) => {
  const body = await getQuery(event);
  const limit = body.limit;

  return await getBooksUseCase(Number(limit));
});
