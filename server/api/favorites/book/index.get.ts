import { isFavoriteUseCase } from "~/server/usecase/favorites/favorites.use-case";

export default defineEventHandler(event => isFavoriteUseCase(event, getQuery(event)));
