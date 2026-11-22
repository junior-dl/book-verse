import { catalogService } from "~/server/services/catalog.service";

export async function getBookUseCase(idOrSlug: string) {
  const book = await catalogService.getBook(idOrSlug);
  if (!book)
    notFound("Book not found");
  return book;
}
