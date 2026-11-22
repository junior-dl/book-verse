import { catalogService } from "~/server/services/catalog.service";

export async function getAuthorUseCase(slug: string) {
  const author = await catalogService.getAuthor(slug);
  if (!author)
    notFound("Author not found");
  return author;
}
