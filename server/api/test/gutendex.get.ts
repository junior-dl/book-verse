import { getQuery } from "h3";

import { gutendexProvider } from "~/server/providers/gutendex/provider";

export default defineEventHandler(async (event) => {
  const { q = "moby dick", page = "1" } = getQuery(event);

  return await gutendexProvider.search(
    String(q),
    Number(page),
  );
});
