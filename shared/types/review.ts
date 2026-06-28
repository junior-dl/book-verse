export type Review = {
  id: string;
  profile_id: string;
  book_id: string;
  source: string;
  rating: number;
  review_text: string;
  created_at: Date;
  updated_at: Date;
};
