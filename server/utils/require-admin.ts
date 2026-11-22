import type { H3Event } from "h3";

import env from "~/lib/env";

/** Signed-in user whose email is listed in ADMIN_EMAILS. */
export async function requireAdmin(event: H3Event) {
  const user = await requireUser(event);
  const admins = env.ADMIN_EMAILS.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

  if (!admins.includes(user.email.toLowerCase())) {
    throw createError({ statusCode: 403, statusMessage: "Admins only" });
  }

  return user;
}
