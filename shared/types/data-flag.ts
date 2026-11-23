export type FlagKind = "many_authors" | "author_after_pub" | "possible_duplicate";
export type FlagAction = "dismiss" | "remove_author" | "merge";

export type DataFlag = {
  id: number;
  kind: FlagKind;
  detail: string;
  createdAt: string;
  work: { id: string; slug: string; title: string };
  workAuthors: { id: string; slug: string; name: string }[];
  author: { id: string; slug: string; name: string } | null;
  otherWork: { id: string; slug: string; title: string } | null;
};
