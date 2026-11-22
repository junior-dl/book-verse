import { getBookUseCase } from "~/server/usecase/catalog/get-book.use-case";

export default defineEventHandler((event) => {
  const id = getRouterParam(event, "id");
  if (!id)
    badRequest("Book ID is required");
  return getBookUseCase(id!);
});
