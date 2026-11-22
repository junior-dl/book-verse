import { getHomeUseCase } from "~/server/usecase/catalog/get-home.use-case";

export default defineCachedEventHandler(() => getHomeUseCase(), {
  name: "home-feed",
  maxAge: 60 * 10,
  swr: true,
});
