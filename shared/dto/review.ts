import z from "zod";

export const ReviewDTO = z.object ({
  id: z.uuid(),
  profileId: z.string(),
  bookId: z.string(),
  source: z.string(),
  rating: z.number(),
  reviewText: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateReviewDTO = z.object ({
  profileId: z.string(),
  bookId: z.string(),
  source: z.string(),
  rating: z.number(),
  reviewText: z.string().optional(),
});

export const UpdateReviewDTO = z.object ({
  rating: z.number(),
  reviewText: z.string().optional(),
  updatedAt: z.iso.datetime(),
});
