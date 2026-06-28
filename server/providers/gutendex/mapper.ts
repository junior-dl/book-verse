import type { BookData } from "~/shared/types";

import type { GutendexBookResponse } from "./types";

export function toBook(
  raw: GutendexBookResponse,
): BookData {
  return {
    external_book_id: String(raw.id),
    source: "gutendex",

    title: raw.title,

    author: raw.authors.map(author => ({
      name: author.name,
      birth_year: author.birth_year,
      death_year: author.death_year,
    })),

    summary: raw.summaries,

    cover_url: raw.formats["image/jpeg"] ?? null,

    language: raw.languages || ["en"],

    download_links: {
      html: raw.formats["text/html"],
      epub: raw.formats["application/epub+zip"],
      mobi: raw.formats["application/x-mobipocket-ebook"],
      text: raw.formats["text/plain; charset=utf-8"],
    },
  };
}
