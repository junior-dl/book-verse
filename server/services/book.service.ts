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

export const bookService = {
  searchBooks,
};
