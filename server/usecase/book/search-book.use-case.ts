import { bookService } from "~/server/services/book.service";

export async function searchBookUseCase(query: string) {
  try {
    return await bookService.searchBooks(query);
  }
  catch (e) {
    console.error("Error in search book usecase", e);
  }
}
