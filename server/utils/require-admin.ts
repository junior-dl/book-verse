import type { H3Event } from "h3";

import env from "~/lib/env";

export function isAdminEmail(email?: string | null) {
  if (!email)
    return false;
  const admins = env.ADMIN_EMAILS.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/** Signed-in user whose email is listed in ADMIN_EMAILS. */
export async function requireAdmin(event: H3Event) {
  const user = await requireUser(event);
  if (!isAdminEmail(user.email)) {
    throw createError({ statusCode: 403, statusMessage: "Admins only" });
  }

  return user;
}
