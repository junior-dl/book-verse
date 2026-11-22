import { catalogService } from "~/server/services/catalog.service";

export default defineCachedEventHandler(() => catalogService.listSubjects(), {
  name: "subjects",
  maxAge: 60 * 30,
  swr: true,
});
