import { boolean, foreignKey, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text(),
  email: text().notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
});

export const profile = pgTable("profile", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  authUserId: text("auth_user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade",
    })
    .unique(),
  username: text().notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  profileId: uuid("profile_id"),
  bookId: text("book_id"),
  source: text(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, table => [
  foreignKey({
    columns: [table.profileId],
    foreignColumns: [profile.id],
    name: "favorites_profile_id_fkey",
  }),
]);

export const readingStatus = pgTable("reading_status", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  profileId: uuid("profile_id"),
  bookId: text("book_id"),
  source: text(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, table => [
  foreignKey({
    columns: [table.profileId],
    foreignColumns: [profile.id],
    name: "reading_status_profile_id_fkey",
  }),
]);

export const shelves = pgTable("shelves", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  profileId: uuid("profile_id"),
  name: text(),
  description: text(),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, table => [
  foreignKey({
    columns: [table.profileId],
    foreignColumns: [profile.id],
    name: "shelves_profile_id_fkey",
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
  profileId: uuid("profile_id"),
  bookId: text("book_id"),
  source: text(),
  rating: numeric(),
  reviewText: text("review_text"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, table => [
  foreignKey({
    columns: [table.profileId],
    foreignColumns: [profile.id],
    name: "reviews_profile_id_fkey",
  }),
]);

export const booksCache = pgTable("books_cache", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  title: text(),
  coverUrl: text("cover_url"),
  author: text("author").array(),
  source: text(),
  externalBookId: text("external_book_id"),
  summary: text("summary").array(),
  language: text("language").array(),
  downloadLinks: text("download_links").array(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  token: text().notNull().unique(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
    mode: "string",
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
    mode: "string",
  }),
  scope: text(),
  password: text(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});
