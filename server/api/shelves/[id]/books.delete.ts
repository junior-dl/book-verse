import { removeShelfBookUseCase } from "~/server/usecase/shelves/shelves.use-case";

export default defineEventHandler(async event => removeShelfBookUseCase(event, await readBody(event)));
