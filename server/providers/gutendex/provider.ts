import type { GetOptions } from "./types";

import { client } from "./client";
import { toBook } from "./mapper";

export const gutendexProvider = {
  async search(query: string, page = 1) {
    const response = await client.searchBooks(query, page);

    // return response.results;

    return {
      books: response.results.map(toBook),
      total: response.count,
      next: response.next,
      previous: response.previous,
    };
  },

  async getBooks(options?: GetOptions) {
    const response = await client.getBooks({
      subject: options?.subject,
      page: options?.page,
    });

    let b = response.results.map(toBook);

    if (options?.random)
      b = b.sort(() => Math.random() - 0.5);
    if (options?.limit)
      b = b.slice(0, options.limit);

    return {
      books: b,
      total: response.count,
      next: response.next,
      previous: response.previous,
    };
  },

  async searchByTitle(title: string, page = 1) {
    return this.search(title, page);
  },

  async searchByAuthor(author: string, page = 1) {
    return this.search(author, page);
  },

  async getBook(id: number) {
    const response = await client.getBook(id);

    return toBook(response);
  },
};
