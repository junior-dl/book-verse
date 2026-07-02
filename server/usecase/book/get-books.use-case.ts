import { bookService } from "~/server/services/book.service";

export async function getBooksUseCase(limit?: number) {
  try {
    return await bookService.getBooks(limit);
  }
  catch (e) {
    console.error("Error in get books use case", e);
  }
}
