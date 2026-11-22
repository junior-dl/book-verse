import { catalogService } from "~/server/services/catalog.service";

export function getHomeUseCase(perSection = 6, trendingCount = 6) {
  return catalogService.getHome(perSection, trendingCount);
}
