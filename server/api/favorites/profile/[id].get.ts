import { listFavoriteBooksUseCase } from "~/server/usecase/favorites/favorites.use-case";

export default defineEventHandler((event) => {
  const profileId = getRouterParam(event, "id");
  if (!profileId)
    badRequest("Profile ID is required");
  return listFavoriteBooksUseCase(profileId!);
});
