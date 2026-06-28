import type { OpenLibraryAuthorResponse, OpenLibrarySearchResponse, OpenLibraryWorkResponse } from "./types";

import { BookNotFoundError, ProviderUnavailableError } from "./errors";

const BASE_URL = "https://www.openlibrary.org";

async function request<T>(url: string): Promise<T> {
  const fullUrl = BASE_URL + url;

  console.warn("Fetching:", fullUrl);

  try {
    const response = await fetch(fullUrl);

    console.warn("Status:", response.status);

    if (response.status === 404)
      throw new BookNotFoundError();

    if (!response.ok)
      throw new ProviderUnavailableError();

    return response.json() as Promise<T>;
  }
  catch (error) {
    console.error("Fetch failed:", fullUrl);
    throw error;
  }
}

export const client = {
  searchBooks(query: string, page = 1) {
    return request<OpenLibrarySearchResponse> (
      `/search.json?q=${encodeURIComponent(query)}&page=${page}`,
    );
  },

  getWork(workKey: string) {
    const key = workKey.replace(/^\/+/, "");
    return request<OpenLibraryWorkResponse>(
      `/${key}.json`,
    );
  },

  getAuthor(authorKey: string) {
    const key = authorKey.replace(/^\/+/, "");

    return request<OpenLibraryAuthorResponse>(
      `/${key}.json`,
    );
  },

  getCoverUrl(
    coverId: number,
    size: "S" | "M" | "L" = "L",
  ) {
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
  },
};
