import { resolveFlagUseCase } from "~/server/usecase/admin/data-health.use-case";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id))
    badRequest("Invalid flag id");
  return resolveFlagUseCase(event, id, await readBody(event));
});
