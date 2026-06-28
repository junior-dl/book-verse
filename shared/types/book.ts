import type { Author } from "./author";

export type Book = {
  id: string;
  title: string;
  coverUrl: string | null;
  author: Author[] | string[];
  source: string;
  externalBookId: string;
  sourceDownloadCount: number;
  downloadCount: number;
  summary: string[];
  language: string[];
  downloadLinks?: BookDownloadLinks;
  subjects?: string[];
  updatedAt: Date;
};

export type BookData = {
  title: string;
  coverUrl: string | null;
  author: Author[] | string[];
  source: string;
  externalBookId: string;
  sourceDownloadCount?: number;
  downloadCount?: number;
  summary: string[];
  language: string[];
  downloadLinks?: BookDownloadLinks;
  subjects?: string[];
};

// MIGRATION
export type BookDownloadLinks = {
  html?: string;
  epub?: string;
  mobi?: string;
  text?: string;
};
