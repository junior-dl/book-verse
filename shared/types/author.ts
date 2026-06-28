export type Author = {
  name: string;
  birth_year: number | null; // TODO update in migration
  death_year: number | null;
  bio?: AuthorDescription | string;
};

type AuthorDescription = {
  type?: string;
  value?: string;
};
