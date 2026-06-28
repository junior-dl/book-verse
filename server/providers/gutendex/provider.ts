import { client } from "./client";

export const gutendexProvider = {
  async search(query: string) {
    const response = await client.searchBooks(query);

    return response.results;
  },

  async getBook(id: number) {
    return client.getBook(id);
  },
};
