import { listFlagsUseCase } from "~/server/usecase/admin/data-health.use-case";

export default defineEventHandler(event => listFlagsUseCase(event));
