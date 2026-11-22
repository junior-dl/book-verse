import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
};

/* ------------------------------------------------------------------ */
/* Auth (better-auth) — unchanged                                     */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text(),
  email: text().notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text(),
  ...timestamps,
});

export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  token: text().notNull().unique(),
  ...timestamps,
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true, mode: "string" }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true, mode: "string" }),
  scope: text(),
  password: text(),
  ...timestamps,
});

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const profile = pgTable("profile", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  authUserId: text("auth_user_id").notNull().references(() => user.id, { onDelete: "cascade" }).unique(),
  name: text("name"),
  email: text("email"),
  username: text().unique("profile_username_unique"),
  avatarUrl: text("avatar_url"),
  about: text("about"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Catalog — one clean row per book / author, filled by n8n           */
/* ------------------------------------------------------------------ */

/** One row per book ("work"), no matter how many providers know it. */
export const works = pgTable("works", {
  id: uuid().defaultRandom().primaryKey(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  /** lowercase, unaccented, no punctuation — used for matching across providers */
  titleNorm: text("title_norm").notNull(),
  subtitle: text(),
  description: text(),
  firstPublishedYear: smallint("first_published_year"),
  languages: text().array().notNull().default(sql`'{}'::text[]`),
  coverUrl: text("cover_url"),
  /** true when at least one free, legal download exists */
  isPublicDomain: boolean("is_public_domain").notNull().default(false),
  /** normalized 0..1000 score used for "trending" & ordering */
  popularity: integer().notNull().default(0),
  /** 0 = raw import, 1 = cross-referenced, 2 = AI-tidied */
  enrichLevel: smallint("enrich_level").notNull().default(0),
  search: tsvector().generatedAlwaysAs(
    sql`setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(subtitle, '')), 'B')`,
  ),
  ...timestamps,
}, t => [
  index("works_title_trgm_idx").using("gin", sql`${t.titleNorm} gin_trgm_ops`),
  index("works_search_idx").using("gin", t.search),
  index("works_popularity_idx").on(t.popularity.desc()),
  index("works_title_norm_idx").on(t.titleNorm),
]);

export const authors = pgTable("authors", {
  id: uuid().defaultRandom().primaryKey(),
  slug: text().notNull().unique(),
  /** "Jane Austen" — display order */
  name: text().notNull(),
  /** "jane austen" — matching key */
  nameNorm: text("name_norm").notNull(),
  birthYear: smallint("birth_year"),
  deathYear: smallint("death_year"),
  bio: text(),
  photoUrl: text("photo_url"),
  /** Open Library author key, e.g. OL21594A — strongest identity signal */
  olKey: text("ol_key").unique(),
  enrichLevel: smallint("enrich_level").notNull().default(0),
  ...timestamps,
}, t => [
  index("authors_name_trgm_idx").using("gin", sql`${t.nameNorm} gin_trgm_ops`),
  uniqueIndex("authors_identity_idx").on(t.nameNorm, sql`coalesce(${t.birthYear}, -9999)`),
]);

export const workAuthors = pgTable("work_authors", {
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => authors.id, { onDelete: "cascade" }),
  position: smallint().notNull().default(0),
  role: text().notNull().default("author"),
}, t => [
  primaryKey({ columns: [t.workId, t.authorId] }),
  index("work_authors_author_idx").on(t.authorId),
]);

/** Small, fixed list of subjects shown in the UI. */
export const subjects = pgTable("subjects", {
  id: smallint().primaryKey().generatedAlwaysAsIdentity(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  sortOrder: smallint("sort_order").notNull().default(100),
  showOnHome: boolean("show_on_home").notNull().default(false),
});

/** Messy provider subject string -> canonical subject. Filled by rules, then Gemini. */
export const subjectAliases = pgTable("subject_aliases", {
  aliasNorm: text("alias_norm").primaryKey(),
  /** null = reviewed and deliberately ignored (e.g. "PS", "Translations into English") */
  subjectId: smallint("subject_id").references(() => subjects.id, { onDelete: "cascade" }),
  decidedBy: text("decided_by").notNull().default("rule"),
});

export const workSubjects = pgTable("work_subjects", {
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  subjectId: smallint("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
}, t => [
  primaryKey({ columns: [t.workId, t.subjectId] }),
  index("work_subjects_subject_idx").on(t.subjectId, t.workId),
]);

/** Raw provider subjects per work, so later Gemini decisions can re-tag old works. */
export const workRawSubjects = pgTable("work_raw_subjects", {
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  aliasNorm: text("alias_norm").notNull().references(() => subjectAliases.aliasNorm, { onDelete: "cascade" }),
}, t => [
  primaryKey({ columns: [t.workId, t.aliasNorm] }),
  index("work_raw_subjects_alias_idx").on(t.aliasNorm),
]);

export const FORMATS = ["epub", "pdf", "mobi", "azw3", "txt", "html", "audio"] as const;

export const workFormats = pgTable("work_formats", {
  id: uuid().defaultRandom().primaryKey(),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  format: text({ enum: FORMATS }).notNull(),
  url: text().notNull(),
  source: text().notNull(),
}, t => [
  unique("work_formats_unique").on(t.workId, t.format, t.source),
]);

export const IDENTIFIER_KINDS = [
  "gutenberg",
  "openlibrary",
  "google",
  "isbn13",
  "isbn10",
  "doi",
  "prh",
] as const;

/** Every provider's ID for a work. (kind, value) is globally unique -> perfect dedupe key. */
export const workIdentifiers = pgTable("work_identifiers", {
  kind: text({ enum: IDENTIFIER_KINDS }).notNull(),
  value: text().notNull(),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
}, t => [
  primaryKey({ columns: [t.kind, t.value] }),
  index("work_identifiers_work_idx").on(t.workId),
]);

/* ------------------------------------------------------------------ */
/* n8n coordination — tiny, rows are deleted once processed           */
/* ------------------------------------------------------------------ */

export const ingestQueue = pgTable("ingest_queue", {
  id: bigserial({ mode: "number" }).primaryKey(),
  /** 'search' (user searched, nothing found) | 'work' (enrich a work) | 'author' | 'subject' */
  kind: text().notNull(),
  /** dedupe key, e.g. "search:dune" or "work:<uuid>" */
  key: text().notNull().unique(),
  payload: jsonb().notNull().default({}),
  attempts: smallint().notNull().default(0),
  priority: smallint().notNull().default(5),
  notBefore: timestamp("not_before", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
}, t => [
  index("ingest_queue_pick_idx").on(t.notBefore, t.priority),
]);

/** One row per day — lets n8n stay inside Gemini / provider free quotas. */
export const apiBudget = pgTable("api_budget", {
  day: date().notNull(),
  service: text().notNull(),
  calls: integer().notNull().default(0),
}, t => [
  primaryKey({ columns: [t.day, t.service] }),
]);

/** Weekly data health check: suspicious data for a person to review. Never auto-applied. */
export const dataFlags = pgTable("data_flags", {
  id: bigserial({ mode: "number" }).primaryKey(),
  kind: text().notNull(),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => authors.id, { onDelete: "cascade" }),
  otherWorkId: uuid("other_work_id").references(() => works.id, { onDelete: "cascade" }),
  detail: text().notNull(),
  status: text().notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "string" }),
}, t => [
  index("data_flags_status_idx").on(t.status, t.createdAt),
]);

/* ------------------------------------------------------------------ */
/* User activity                                                       */
/* ------------------------------------------------------------------ */

export const favorites = pgTable("favorites", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  profileId: uuid("profile_id").notNull().references(() => profile.id, { onDelete: "cascade" }),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, t => [
  unique("favorites_profile_work_unique").on(t.profileId, t.workId),
]);

export const READING_STATUSES = ["want_to_read", "reading", "finished", "dropped"] as const;

export const readingStatus = pgTable("reading_status", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  profileId: uuid("profile_id").notNull().references(() => profile.id, { onDelete: "cascade" }),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  status: text({ enum: READING_STATUSES }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, t => [
  unique("reading_status_profile_work_unique").on(t.profileId, t.workId),
]);

export const shelves = pgTable("shelves", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  profileId: uuid("profile_id").notNull().references(() => profile.id, { onDelete: "cascade" }),
  name: text().notNull(),
  description: text(),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const shelfBooks = pgTable("shelf_books", {
  shelfId: uuid("shelf_id").notNull().references(() => shelves.id, { onDelete: "cascade" }),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, t => [
  primaryKey({ columns: [t.shelfId, t.workId] }),
]);

export const reviews = pgTable("reviews", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  profileId: uuid("profile_id").notNull().references(() => profile.id, { onDelete: "cascade" }),
  workId: uuid("work_id").notNull().references(() => works.id, { onDelete: "cascade" }),
  rating: numeric({ precision: 2, scale: 1, mode: "number" }),
  reviewText: text("review_text"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, t => [
  unique("reviews_profile_work_unique").on(t.profileId, t.workId),
]);
