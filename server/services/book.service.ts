import { eq, ilike, sql } from "drizzle-orm";

import db from "../db";
import { booksCache } from "../db/schema";
import { gutendexProvider } from "../providers/gutendex/provider";

async function searchBooks(query: string) {
  // if book is found in library
  const cached = await db
    .select()
    .from(booksCache)
    .where(ilike(booksCache.title, `%${query}%`));

  const results = await gutendexProvider.search(query);

  if (results.books.length > 0) {
    const inserted = await db.insert(booksCache).values(results.books).onConflictDoNothing().returning();
    const unique = new Map();

    for (const book of [...cached, ...inserted]) {
      unique.set(book.externalBookId, book);
    }

    return {
      source: "provider",
      data: [...unique.values()],
    };
  }
}

async function getBooks(books_limit?: number, randomized = true) {
  let query = db
    .select()
    .from(booksCache)
    .$dynamic();

  if (randomized) {
    query = query.orderBy(sql`RANDOM()`);
  }

  if (books_limit !== undefined) {
    query = query.limit(books_limit);
  }

  const cached = await query;

  if (cached.length > 0) {
    return {
      source: "cache",
      data: cached,
    };
  }

  const results = await gutendexProvider.getBooks({
    limit: books_limit,
    random: randomized,
  });

  // 3. store in cache
  if (results.books.length > 0) {
    const inserted = await db.insert(booksCache).values(results.books).onConflictDoNothing().returning();

    return {
      source: "provider",
      data: inserted,
    };
  }
}

async function getBooksBySubject(books_subject?: string, books_limit?: number, randomized = true) {
  let query = db
    .select()
    .from(booksCache)
    .where(
      sql`${booksCache.subjects} @> ${JSON.stringify([books_subject])}::jsonb`,
    )
    .$dynamic();

  if (randomized) {
    query = query.orderBy(sql`RANDOM()`);
  }

  if (books_limit !== undefined) {
    query = query.limit(books_limit);
  }

  const cached = await query;

  if (cached.length > 0) {
    return {
      source: "cache",
      data: cached,
    };
  }

  const results = await gutendexProvider.getBooks({
    subject: books_subject,
    limit: books_limit,
    random: randomized,
  });

  // 3. store in cache
  if (results.books.length > 0) {
    const inserted = await db.insert(booksCache).values(results.books).onConflictDoNothing().returning();
    return {
      source: "provider",
      data: inserted,
    };
  }
}

async function getBookById(id: string) {
  const cached = await db
    .select()
    .from(booksCache)
    .where(eq(booksCache.id, id));

  return {
    source: "cache",
    data: cached[0],
  };
}

export const bookService = {
  searchBooks,
  getBooks,
  getBooksBySubject,
  getBookById,
};
