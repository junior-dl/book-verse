import { removeFavoriteUseCase } from "~/server/usecase/favorites/favorites.use-case";

export default defineEventHandler(async event => removeFavoriteUseCase(event, await readBody(event)));
