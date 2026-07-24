export type Favorite = {
  id: string;
  profileId: string | null | undefined;
  bookId?: string | null;
  source: string | null | undefined;
  createdAt: string | null | undefined;
};
