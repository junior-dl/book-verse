import { client } from "./client";
import { toBook } from "./mapper";

async function buildBook(workKey: string) {
  const work = await client.getWork(workKey);

  const authors = await Promise.all(
    (work.authors ?? []).map(author =>
      client.getAuthor(author.author.key),
    ),
  );

  const coverId = work.covers?.[0];

  const coverUrl
    = coverId !== undefined
      ? client.getCoverUrl(coverId)
      : null;

  return toBook(work, authors, coverUrl);
}

export const openLibraryProvider = {
  async search(query: string, page = 1) {
    const response = await client.searchBooks(query, page);

    const books = await Promise.all (response.docs.map(doc => buildBook(doc.key)));

    return {
      books,
      total: response.numFound,
      next: response.start + response.docs.length < response.numFound ? page + 1 : null,
      previous: page > 1 ? page - 1 : null,
    };
  },

  async searchByTitle(title: string, page = 1) {
    return this.search(title, page);
  },

  async searchByAuthor(author: string, page = 1) {
    return this.search(author, page);
  },

  async getBook(workKey: string) {
    return buildBook(workKey);
  },
};
