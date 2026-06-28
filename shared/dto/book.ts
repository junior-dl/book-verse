import z from "zod";

export const BookDTO = z.object ({
  id: z.string(),
  title: z.string(),
  coverUrl: z.string(),
  author: z.json(),
  source: z.string(),
  externalBookId: z.string(),
  sourceDownloadCount: z.number(),
  downloadCount: z.number(),
  summary: z.string().array(),
  language: z.string().array(),
  downloadLinks: z.json(),
  subjects: z.string().array(),
  updatedAt: z.iso.datetime(),
});

export const SearchBookDTOSchema = z.object ({
  title: z.string(),
});

export type SearchBookDTO = z.infer<typeof SearchBookDTOSchema>;
