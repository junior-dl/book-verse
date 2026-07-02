import type { Book } from "~/shared/types";

import type { OpenLibraryAuthorResponse, OpenLibraryWorkResponse } from "./types";

export function toBook(work: OpenLibraryWorkResponse, authors: OpenLibraryAuthorResponse[], cover_url: string | null): Book {
  return {

    externalBookId: work.key,
    source: "openlibrary",

    title: work.title,

    author: authors.map(author => ({
      name: author.name,
      birthYear: author.birth_date
        ? Number(author.birth_date.match(/\d{4}/)?.[0] ?? null)
        : null,
      deathYear: author.death_date
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

    coverUrl: cover_url,

    language:
      work.languages?.map(language =>
        language.key.split("/").pop() ?? "",
      ) ?? [],

    subjects: work.subjects ?? [],

    downloadLinks: undefined,
  };
}
