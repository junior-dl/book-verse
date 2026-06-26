import { boolean, foreignKey, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  username: text(),
  name: text(),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash"),
  googleId: text("google_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id"),
  bookId: text("book_id"),
  source: text(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, table => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "favorites_user_id_fkey",
  }),
]);

export const readingStatus = pgTable("reading_status", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id"),
  bookId: text("book_id"),
  source: text(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, table => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "reading_status_user_id_fkey",
  }),
]);

export const shelves = pgTable("shelves", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id"),
  name: text(),
  description: text(),
  isPublic: boolean("is_public"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, table => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "shelves_user_id_fkey",
  }),
]);

export const shelfBooks = pgTable("shelf_books", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  shelfId: uuid("shelf_id"),
  bookId: text("book_id"),
  source: text(),
  addedAt: timestamp("added_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, table => [
  foreignKey({
    columns: [table.shelfId],
    foreignColumns: [shelves.id],
    name: "shelf_books_shelf_id_fkey",
  }),
]);

export const reviews = pgTable("reviews", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id"),
  bookId: text("book_id"),
  source: text(),
  rating: numeric(),
  reviewText: text("review_text"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, table => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "reviews_user_id_fkey",
  }),
]);

export const booksCache = pgTable("books_cache", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  title: text(),
  coverUrl: text("cover_url"),
  authorName: text("author_name"),
  source: text(),
  externalBookId: text("external_book_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
