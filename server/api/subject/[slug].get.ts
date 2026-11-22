import { getSubjectBooksUseCase } from "~/server/usecase/catalog/get-subject-books.use-case";

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug)
    badRequest("Subject is required");
  const { page, pageSize } = parsePaging(getQuery(event));
  return getSubjectBooksUseCase(slug!, page, pageSize);
});
