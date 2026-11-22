import { scanNowUseCase } from "~/server/usecase/admin/data-health.use-case";

export default defineEventHandler(event => scanNowUseCase(event));
