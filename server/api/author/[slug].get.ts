import { getAuthorUseCase } from "~/server/usecase/catalog/get-author.use-case";

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug)
    badRequest("Author is required");
  return getAuthorUseCase(slug!);
});
