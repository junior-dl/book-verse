import type { GutendexBookResponse, GutendexSearchResponse } from "./types";

import { BookNotFoundError, ProviderUnavailableError } from "./errors";

const BASE_URL = "https://gutendex.com";

async function request<T>(url: string): Promise<T> {
  // const response = await fetch(`${BASE_URL}${url}`);
  const response = await fetch(BASE_URL + url);

  if (response.status === 404)
    throw new BookNotFoundError();

  if (!response.ok)
    throw new ProviderUnavailableError();

  return response.json();
};

export const client = {
  searchBooks(query: string, page = 1) {
    return request<GutendexSearchResponse>(
      `/books?search=${encodeURIComponent(query)}&page=${page}`,
    );
  },

  getBook(id: number) {
    return request<GutendexBookResponse>(
      `/books/${id}`,
    );
  },

  getBooks(params?: {
    subject?: string;
    page?: number;
  }) {
    const search = new URLSearchParams();

    if (params?.subject)
      search.set("subject", params?.subject);
    if (params?.page)
      search.set("page", String(params?.page));

    return request<GutendexSearchResponse>(
      `/books?${search.toString()}`,
    );
  },
};
