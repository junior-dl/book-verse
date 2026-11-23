import { shelvesForBookUseCase } from "~/server/usecase/shelves/shelves.use-case";

export default defineEventHandler(event => shelvesForBookUseCase(event));
