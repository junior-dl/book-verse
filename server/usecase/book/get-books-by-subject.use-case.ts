import { bookService } from "~/server/services/book.service";

export async function getBooksBySubjectUseCase(subject?: string, limit?: number, randomized?: boolean) {
  try {
    return await bookService.getBooksBySubject(subject, limit, randomized);
  }
  catch (e) {
    console.error("Error in get books use case", e);
  }
}
