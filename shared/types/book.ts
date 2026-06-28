import type { Author } from "./author";

export type Book = {
  id: string;
  title: string;
  cover_url: string | null;
  author: Author[];
  source: string;
  external_book_id: string;
  summary: string[];
  language: string[];
  download_links?: BookDownloadLinks;
  subjects?: string[];
  updated_at: Date;
};

export type BookData = {
  title: string;
  cover_url: string | null;
  author: Author[];
  source: string;
  external_book_id: string;
  summary: string[];
  language: string[];
  download_links?: BookDownloadLinks;
  subjects?: string[];
};

// MIGRATION
export type BookDownloadLinks = {
  html?: string;
  epub?: string;
  mobi?: string;
  text?: string;
};
