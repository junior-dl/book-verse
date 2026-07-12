import type { Book } from "~/shared/types";

import type { GutendexBookResponse } from "./types";

export function toBook(
  raw: GutendexBookResponse,
): Book {
  // console.warn(raw);
  return {
    externalBookId: raw.id?.toString?.() ?? null,
    sourceDownloadCount: raw.download_count,
    source: "gutendex",

    title: raw.title,

    author: raw.authors.map(author => ({
      name: author.name,
      birthYear: author.birth_year,
      deathYear: author.death_year,
    })),

    summary: raw.summaries,

    coverUrl: raw.formats?.["image/jpeg"] || raw.formats?.["image/png"] || raw.formats?.["image/webp"] || null,

    language: raw.languages || ["en"],

    subjects: raw.subjects ?? [],

    downloadLinks: {
      html: raw.formats["text/html"],
      epub: raw.formats["application/epub+zip"],
      mobi: raw.formats["application/x-mobipocket-ebook"],
      text: raw.formats["text/plain; charset=utf-8"],
    },
  };
}
