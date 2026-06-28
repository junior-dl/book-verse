import z from "zod";

export const ReviewDTO = z.object ({
  id: z.uuid(),
  profile_id: z.string(),
  book_id: z.string(),
  source: z.string(),
  rating: z.number(),
  review_text: z.string().optional(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const CreateReviewDTO = z.object ({
  profile_id: z.string(),
  book_id: z.string(),
  source: z.string(),
  rating: z.number(),
  review_text: z.string().optional(),
});

export const UpdateReviewDTO = z.object ({
  rating: z.number(),
  review_text: z.string().optional(),
  updated_at: z.iso.datetime(),
});
