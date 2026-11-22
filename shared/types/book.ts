export const BOOK_FORMATS = ["epub", "pdf", "mobi", "azw3", "txt", "html", "audio"] as const;
export type BookFormatKind = (typeof BOOK_FORMATS)[number];

export type AuthorRef = {
  slug: string;
  name: string;
};

export type SubjectRef = {
  slug: string;
  name: string;
};

export type BookFormat = {
  format: BookFormatKind;
  url: string;
  source: string;
};

/** Lightweight shape used in grids, carousels and search results. */
export type BookCard = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  isPublicDomain: boolean;
  authors: AuthorRef[];
};

/** Full shape for the book detail page. */
export type Book = BookCard & {
  subtitle: string | null;
  description: string | null;
  firstPublishedYear: number | null;
  languages: string[];
  popularity: number;
  subjects: SubjectRef[];
  formats: BookFormat[];
  identifiers: { kind: string; value: string }[];
};

export type HomeFeed = {
  trending: (BookCard & { description: string | null })[];
  sections: (SubjectRef & { books: BookCard[] })[];
};

export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};
