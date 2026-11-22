import type { BookCard } from "./book";

export type Author = {
  id: string;
  slug: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  bio: string | null;
  photoUrl: string | null;
};

export type AuthorPage = Author & {
  books: BookCard[];
};
