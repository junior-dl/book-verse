// Search API
export type OpenLibrarySearchResponse = {
  numFound: number;
  start: number;
  numFoundExact: boolean;
  docs: OpenLibrarySearchDoc[];
};

export type OpenLibrarySearchDoc = {
  key: string;
  title: string;
  author_name?: string[];
  author_key?: string[];
  language?: string[];
  subject?: string[];
  cover_i?: number;
  first_publish_year?: number;
  edition_count?: number;
};

// Work API
export type OpenLibraryWorkResponse = {
  key: string;
  title: string;
  description?: OpenLibraryDescription;
  subjects?: string[];
  covers?: number[];
  authors?: OpenLibraryWorkAuthor[];
  languages?: OpenLibraryLanguageReference[];
};

export type OpenLibraryDescription = {
  type?: string;
  value?: string;
};

export type OpenLibraryWorkAuthor = {
  author: {
    key: string;
  };
  type?: {
    key: string;
  };
};

export type OpenLibraryLanguageReference = {
  key: string;
};

// Author API
export type OpenLibraryAuthorResponse = {
  key: string;
  name: string;
  birth_date?: string;
  death_date?: string;
  bio?: OpenLibraryDescription | string;
};

// Internal helper types
export type OpenLibraryAuthor = {
  name: string;
  birth_year: number | null;
  death_year: number | null;
};
