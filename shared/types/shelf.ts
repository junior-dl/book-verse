export type Shelf = {
  id: string;
  profileId: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ShelfSummary = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  bookCount: number;
  covers: { title: string; coverUrl: string | null }[];
  updatedAt: string;
};

export type ShelfDetail = ShelfSummary & {
  isOwner: boolean;
  books: import("./book").BookCard[];
};

export type ShelfForBook = {
  id: string;
  name: string;
  hasBook: boolean;
};
