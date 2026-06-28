import z from "zod";

export const BookDTO = z.object ({
  id: z.string(),
  title: z.string(),
  cover_url: z.string(),
  author_name: z.string().array(),
  source: z.string(),
  external_book_id: z.string(),
  summary: z.string().array(),
  language: z.string().array(),
  download_links: z.string().array(),
  updated_at: z.iso.datetime(),
});
