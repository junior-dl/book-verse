import { searchBooksUseCase } from "~/server/usecase/catalog/search-books.use-case";

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const q = String(query.q ?? "").trim();
  if (!q)
    badRequest("Query is required");
  const { page, pageSize } = parsePaging(query);
  return searchBooksUseCase(q, page, pageSize);
});
