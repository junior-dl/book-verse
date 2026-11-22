import { catalogService } from "~/server/services/catalog.service";

export function searchBooksUseCase(query: string, page: number, pageSize: number) {
  return catalogService.searchBooks(query.slice(0, 120), page, pageSize);
}
