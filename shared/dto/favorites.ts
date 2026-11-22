import z from "zod";

/** The profile is always taken from the signed-in session, never from the request body. */
export const FavoriteDTOSchema = z.object({
  workId: z.uuid(),
});

export type FavoriteDTO = z.infer<typeof FavoriteDTOSchema>;
