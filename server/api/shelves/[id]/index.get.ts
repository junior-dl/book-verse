import { getShelfUseCase } from "~/server/usecase/shelves/shelves.use-case";

export default defineEventHandler(event => getShelfUseCase(event));
