import { catalogService } from "~/server/services/catalog.service";

export async function getSubjectBooksUseCase(slug: string, page: number, pageSize: number) {
  const result = await catalogService.getSubjectBooks(slug, page, pageSize);
  if (!result)
    notFound("Subject not found");
  return result;
}
