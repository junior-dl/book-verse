import z from "zod";

export const CreateFavoritesDTOSchema = z.object ({
  profileId: z.string(),
  bookId: z.string(),
  source: z.string(),
});

export type CreateFavoritesDTO = z.infer<typeof CreateFavoritesDTOSchema>;

export const ValidateFavoritesDTOSchema = z.object ({
  bookId: z.string(),
  profileId: z.string(),
});

export type ValidateFavoritesDTO = z.infer<typeof ValidateFavoritesDTOSchema>;
