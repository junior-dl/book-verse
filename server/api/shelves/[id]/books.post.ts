import { addShelfBookUseCase } from "~/server/usecase/shelves/shelves.use-case";

export default defineEventHandler(async event => addShelfBookUseCase(event, await readBody(event)));
