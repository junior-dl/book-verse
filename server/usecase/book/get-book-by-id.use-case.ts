import { bookService } from "~/server/services/book.service";

export async function getBookByIdUseCase(id: string) {
  try {
    return await bookService.getBookById(id);
  }
  catch (e) {
    console.error("Error in fetching book details use case", e);
  }
}
