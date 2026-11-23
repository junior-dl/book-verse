import type { H3Event } from "h3";

import z from "zod";

import { auth } from "~/lib/auth";
import { favoritesService } from "~/server/services/favorites.service";
import { shelvesService } from "~/server/services/shelves.service";
import { CreateShelfDTOSchema, ShelfBookDTOSchema, UpdateShelfDTOSchema } from "~/shared/dto";

const IdSchema = z.uuid();

async function requireProfileId(event: H3Event) {
  const user = await requireUser(event);
  const profileId = await favoritesService.getProfileIdForUser(user.id);
  if (!profileId)
    notFound("Profile not found");
  return profileId!;
}

function shelfId(event: H3Event) {
  const parsed = IdSchema.safeParse(getRouterParam(event, "id"));
  if (!parsed.success)
    notFound("Shelf not found");
  return parsed.data!;
}

export async function listMyShelvesUseCase(event: H3Event) {
  return shelvesService.listMine(await requireProfileId(event));
}

export async function createShelfUseCase(event: H3Event, body: unknown) {
  const profileId = await requireProfileId(event);
  const result = await shelvesService.create(profileId, validate(CreateShelfDTOSchema, body));
  if (!result.ok)
    badRequest(result.reason);
  return result;
}

export async function getShelfUseCase(event: H3Event) {
  const id = shelfId(event);
  // Signed out is fine for public shelves
  const session = await auth.api.getSession({ headers: event.headers });
  const viewer = session ? await favoritesService.getProfileIdForUser(session.user.id) : null;
  const shelf = await shelvesService.get(id, viewer);
  if (!shelf)
    notFound("Shelf not found");
  return shelf;
}

export async function updateShelfUseCase(event: H3Event, body: unknown) {
  const ok = await shelvesService.update(shelfId(event), await requireProfileId(event), validate(UpdateShelfDTOSchema, body));
  if (!ok)
    notFound("Shelf not found");
  return { ok };
}

export async function deleteShelfUseCase(event: H3Event) {
  const ok = await shelvesService.remove(shelfId(event), await requireProfileId(event));
  if (!ok)
    notFound("Shelf not found");
  return { ok };
}

export async function addShelfBookUseCase(event: H3Event, body: unknown) {
  const { workId } = validate(ShelfBookDTOSchema, body);
  const result = await shelvesService.addBook(shelfId(event), await requireProfileId(event), workId);
  if (!result.ok)
    badRequest(result.reason);
  return result;
}

export async function removeShelfBookUseCase(event: H3Event, body: unknown) {
  const { workId } = validate(ShelfBookDTOSchema, body);
  const ok = await shelvesService.removeBook(shelfId(event), await requireProfileId(event), workId);
  if (!ok)
    notFound("Shelf not found");
  return { ok };
}

export async function shelvesForBookUseCase(event: H3Event) {
  const { workId } = validate(ShelfBookDTOSchema, getQuery(event));
  return shelvesService.forBook(await requireProfileId(event), workId);
}
