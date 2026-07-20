import { bookService } from "~/server/services/book.service";

export async function getBooksByIdUseCase(ids: string[]) {
  try {
    return await bookService.getBooksById(ids);
  }
  catch (e) {
    console.error("Error in fetching books use case: ", e);
  }
}
