import { getBooksBySubjectUseCase } from "~/server/usecase/book/get-books-by-subject.use-case";

export default defineEventHandler (async (event) => {
  const q = await getQuery(event);

  const { subject, limit, randomized }: { subject?: string; limit?: number; randomized?: boolean } = q;

  return await getBooksBySubjectUseCase(subject, limit, randomized);
});
