import { updateShelfUseCase } from "~/server/usecase/shelves/shelves.use-case";

export default defineEventHandler(async event => updateShelfUseCase(event, await readBody(event)));
