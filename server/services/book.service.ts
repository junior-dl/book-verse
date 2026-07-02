import { ilike } from "drizzle-orm";

import db from "../db";
import { booksCache } from "../db/schema";
import { gutendexProvider } from "../providers/gutendex/provider";

async function searchBooks(query: string) {
  const cached = await db
    .select()
    .from(booksCache)
    .where(ilike(booksCache.title, `%${query}%`));

  if (cached.length > 0) {
    return {
      source: "cache",
      data: cached,
    };
  }

  // 2. call provider (FIXED NAME)
  const results = await gutendexProvider.search(query);

  // 3. store in cache
  if (results.books.length > 0) {
    await db.insert(booksCache).values(results.books).onConflictDoNothing();
  }

  return {
    source: "provider",
    data: results.books,
  };
}

async function getBooks(books_limit?: number, randomized = true) {
  const result = await gutendexProvider.getBooks({
    limit: books_limit,
    random: randomized,
  });

  return {
    source: "provider",
    data: result.books,
  };
}

async function getBooksBySubject(books_subject?: string, books_limit?: number, randomized = true) {
  const result = await gutendexProvider.getBooks({
    subject: books_subject,
    limit: books_limit,
    random: randomized,
  });

  return {
    source: "provider",
    data: result.books,
  };
}

export const bookService = {
  searchBooks,
  getBooks,
  getBooksBySubject,
};
