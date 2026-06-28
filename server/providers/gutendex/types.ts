export type GutendexAuthor = {
  name: string;
  birth_year: number | null;
  death_year: number | null;
};

export type GutendexBookResponse = {
  id: number;
  title: string;
  authors: GutendexAuthor[];
  summaries: string[];
  bookshelves?: string[];
  languages?: string[];
  copyright?: boolean;
  media_type: string;
  formats: Record<string, string>;
  download_count: number;
};

export type GutendexSearchResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutendexBookResponse[];
};
