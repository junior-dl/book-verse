import { getQuery } from "h3";

import { openLibraryProvider } from "~/server/providers/open-library/provider";

export default defineEventHandler(async (event) => {
  const {
    type = "search",
    q = "moby dick",
    page = "1",
    work,
  } = getQuery(event);

  switch (type) {
    case "search":
      return openLibraryProvider.search(
        String(q),
        Number(page),
      );

    case "title":
      return openLibraryProvider.searchByTitle(
        String(q),
        Number(page),
      );

    case "author":
      return openLibraryProvider.searchByAuthor(
        String(q),
        Number(page),
      );

    case "book":
      if (!work) {
        throw createError({
          statusCode: 400,
          statusMessage: "Missing work parameter",
        });
      }

      return openLibraryProvider.getBook(String(work));

    default:
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid test type",
      });
  }
});
