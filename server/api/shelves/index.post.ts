import { createShelfUseCase } from "~/server/usecase/shelves/shelves.use-case";

export default defineEventHandler(async event => createShelfUseCase(event, await readBody(event)));
