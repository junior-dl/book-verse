import { listMyShelvesUseCase } from "~/server/usecase/shelves/shelves.use-case";

export default defineEventHandler(event => listMyShelvesUseCase(event));
