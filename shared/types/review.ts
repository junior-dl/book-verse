export type Review = {
  id: string;
  profileId: string;
  workId: string;
  rating: number;
  reviewText: string;
  createdAt: Date;
  updatedAt: Date;
};
