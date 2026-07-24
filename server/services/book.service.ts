import { eq, ilike, inArray, sql } from "drizzle-orm";

import db from "../db";
import { booksCache } from "../db/schema";
import { gutendexProvider } from "../providers/gutendex/provider";

// Local
async function cacheBooks(books: typeof booksCache.$inferInsert[]) {
  return db
    .insert(booksCache)
    .values(books)
    .onConflictDoNothing()
    .returning();
}

async function getCachedBooks(limit?: number, randomized = true) {
  let query = db
    .select()
    .from(booksCache)
    .$dynamic();

  if (randomized) {
    query = query.orderBy(sql`RANDOM()`);
  }

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  return query;
}

function subjectFilter(subject: string | undefined) {
  return sql`
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(${booksCache.subjects}) AS s
      WHERE s ILIKE ${`%${subject}%`}
    )
  `;
}

function mergeUniqueBooks(...lists: (typeof booksCache.$inferSelect)[][]) {
  const unique = new Map();

  for (const list of lists) {
    for (const book of list) {
      unique.set(book.externalBookId, book);
    }
  }

  return [...unique.values()];
}

// Exported
async function searchBooks(query: string) {
  // if book is found in library
  const cached = await db
    .select()
    .from(booksCache)
    .where(ilike(booksCache.title, `%${query}%`));

  const results = await gutendexProvider.search(query);

  if (results.books.length > 0) {
    const inserted = await cacheBooks(results.books);

    return {
      source: "provider",
      data: mergeUniqueBooks(cached, inserted),
    };
  }
}

async function getBooks(books_limit?: number, randomized = true) {
  const cached = await getCachedBooks(books_limit, randomized);

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
    const inserted = await cacheBooks(results.books);

    return {
      source: "provider",
      data: inserted,
    };
  }
}

async function getBooksBySubject(books_subject?: string, books_limit?: number, randomized = true) {
  // if book is found in library
  const limit = books_limit ?? 5;

  const cached = await db
    .select()
    .from(booksCache)
    .where(subjectFilter(books_subject))
    .limit(limit);

  if (cached.length >= limit && cached.length > 0) {
    return {
      source: "source",
      data: cached,
    };
  }

  const missing = limit - cached.length;

  const results = await gutendexProvider.getBooks({
    subject: books_subject,
    limit: missing,
    random: randomized,
  });

  if (results.books.length > 0) {
    await cacheBooks(results.books);

    const books = await db
      .select()
      .from(booksCache)
      .where(subjectFilter(books_subject));

    return {
      source: "provider",
      data: books,
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

async function getBooksById(ids: string[]) {
  const result = await db
    .select()
    .from(booksCache)
    .where(inArray(booksCache.id, ids));

  return {
    source: "cache",
    data: result,
  };
}

export const bookService = {
  searchBooks,
  getBooks,
  getBooksBySubject,
  getBookById,
  getBooksById,
};
