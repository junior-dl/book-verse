export type Review = {
  id: string;
  profileId: string;
  bookId: string;
  source: string;
  rating: number;
  reviewText: string;
  createdAt: Date;
  updatedAt: Date;
};
