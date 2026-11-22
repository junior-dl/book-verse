export type ReadingStatus = {
  id: string;
  profileId: string;
  workId: string;
  status: "want_to_read" | "reading" | "finished" | "dropped";
  createdAt: string;
};
