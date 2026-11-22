import { addFavoriteUseCase } from "~/server/usecase/favorites/favorites.use-case";

export default defineEventHandler(async event => addFavoriteUseCase(event, await readBody(event)));
