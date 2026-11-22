import type { H3Event } from "h3";

import z from "zod";

import { healthService } from "~/server/services/health.service";

const ResolveSchema = z.object({ action: z.enum(["dismiss", "remove_author", "merge"]) });

export async function listFlagsUseCase(event: H3Event) {
  await requireAdmin(event);
  return healthService.listOpen();
}

export async function resolveFlagUseCase(event: H3Event, id: number, body: unknown) {
  await requireAdmin(event);
  const { action } = validate(ResolveSchema, body);
  const result = await healthService.resolve(id, action);
  if (!result.ok)
    badRequest(result.reason);
  return result;
}

export async function scanNowUseCase(event: H3Event) {
  await requireAdmin(event);
  return healthService.scanNow();
}
