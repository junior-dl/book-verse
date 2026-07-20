import { eq } from "drizzle-orm";

import type { UpdateProfileDTO } from "~/shared/dto";

import db from "../db";
import { profile } from "../db/schema";

async function getProfileById(a_id: string) {
  const results = await db
    .select()
    .from(profile)
    .where(eq(profile.authUserId, a_id));

  return results[0];
}

async function updateProfileById(id: string, data: Partial<UpdateProfileDTO>) {
  const updated = await db
    .update(profile)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(profile.id, id))
    .returning();

  return updated[0];
}

export const profileService = {
  getProfileById,
  updateProfileById,
};
