export type Author = {
  name: string;
  birthYear: number | null; // TODO update in migration
  deathYear: number | null;
  bio?: AuthorDescription | string;
};

type AuthorDescription = {
  type?: string;
  value?: string;
};
