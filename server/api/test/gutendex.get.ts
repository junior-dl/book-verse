// import { gutendexProvider } from "~/server/providers/gutendex/provider";

// export default defineEventHandler(async () => {
//   return await gutendexProvider.search("moby dick");
// });

import { client } from "~/server/providers/gutendex/client";

export default defineEventHandler(async () => {
  return await client.searchBooks("shakespeare");
});
