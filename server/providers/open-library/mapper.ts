import type { BookData } from "~/shared/types";

import type { OpenLibraryAuthorResponse, OpenLibraryWorkResponse } from "./types";

export function toBook(work: OpenLibraryWorkResponse, authors: OpenLibraryAuthorResponse[], coverUrl: string | null): BookData {
  return {
    external_book_id: work.key,
    source: "openlibrary",

    title: work.title,

    author: authors.map(author => ({
      name: author.name,
      birth_year: author.birth_date
        ? Number(author.birth_date.match(/\d{4}/)?.[0] ?? null)
        : null,
      death_year: author.death_date
        ? Number(author.death_date.match(/\d{4}/)?.[0] ?? null)
        : null,
      bio: author.bio,
    })),

    summary:
      typeof work.description === "string"
        ? [work.description]
        : work.description?.value
          ? [work.description.value]
          : [],

    cover_url: coverUrl,

    language:
      work.languages?.map(language =>
        language.key.split("/").pop() ?? "",
      ) ?? [],

    subjects: work.subjects ?? [],

    download_links: undefined,
  };
}
