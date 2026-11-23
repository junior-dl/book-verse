import { deleteShelfUseCase } from "~/server/usecase/shelves/shelves.use-case";

export default defineEventHandler(event => deleteShelfUseCase(event));
