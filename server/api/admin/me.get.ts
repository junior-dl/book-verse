import { sql } from "drizzle-orm";

import { auth } from "~/lib/auth";
import db from "~/server/db";

/** Never throws: tells the navbar whether to show the admin link, and how many flags are open. */
export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!isAdminEmail(session?.user?.email))
    return { isAdmin: false, openFlags: 0 };

  const [row] = (await db.execute(sql`SELECT count(*)::int AS n FROM data_flags WHERE status = 'open'`)).rows as { n: number }[];
  return { isAdmin: true, openFlags: row?.n ?? 0 };
});
