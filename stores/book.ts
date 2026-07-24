import type { Book } from "#imports";

import { BOOK_SUBJECTS, MAX_BOOKS_PER_PAGE } from "~/constants/book";

export const useBookStore = defineStore("books", () => {
  const featuredBooks = ref<Book[]>([]);
  const featuredLoading = ref(false);

  const subjectBooks = ref<Record<string, Book[]>>({});
  const subjectBookLoading = ref(false);

  const searchedBooks = ref<Book[]>([]);
  const searchLoading = ref(false);

  const bookDetails = ref<Book>();
  const bookDetailsLoading = ref(false);

  const profileFavoriteBooks = ref<Book[]>([]);
  const profileFavoriteBooksLoading = ref(false);

  const fetchFeaturedBooks = async () => {
    featuredLoading.value = true;
    try {
      const books = await $fetch<{
        source: string;
        data: Book[];
      }>("api/book", {
        method: "GET",
        query: {
          limit: MAX_BOOKS_PER_PAGE - 1,
        },
      });
      featuredBooks.value = books.data;
      return books;
    }
    catch (error) {
      console.error("Failed to fetch featured Books:", error);
      return featuredBooks.value;
    }
    finally {
      featuredLoading.value = false;
    }
  };

  const fetchSubjectBooks = async (subject: string) => {
    subjectBookLoading.value = true;
    try {
      const books = await $fetch<{
        source: string;
        data: Book[];
      }>("/api/book/subject", {
        method: "GET",
        query: {
          subject,
          limit: MAX_BOOKS_PER_PAGE,
          randomized: true,
        },
      });
      subjectBooks.value[subject] = books.data;
      return books;
    }
    catch (e) {
      console.error("Failed to fetch ", subject, " books: ", e);
      return subjectBooks.value;
    }
    finally {
      subjectBookLoading.value = false;
    }
  };

  const searchBook = async (query: string) => {
    searchLoading.value = true;
    try {
      const response = await $fetch<{
        source: string;
        data: Book[];
      }>("/api/book/search", {
        query: { q: query },
      });
      searchedBooks.value = response?.data;
      return response;
    }
    catch (e) {
      console.error("Failed to fetch books for ", query, ": ", e);
    }
    finally {
      searchLoading.value = false;
    }
  };

  const getBookDetails = async (id: string) => {
    bookDetailsLoading.value = true;

    try {
      const response = await $fetch<{
        source: string;
        data: Book;
      }>(`/api/book/${id}`, {
        method: "GET",
      });

      bookDetails.value = response?.data;
      return response;
    }
    catch (e) {
      console.error("Failed to fetch book details for book id: ", id, " : ", e);
      return bookDetails.value;
    }
    finally {
      bookDetailsLoading.value = false;
    }
  };

  const fetchProfileFavoriteBooks = async (ids: string[]) => {
    profileFavoriteBooksLoading.value = true;
    try {
      const response = await $fetch<{ source: string; data: Book[] }>("/api/book/profile", { method: "GET", query: { ids } });
      profileFavoriteBooks.value = response.data;
      return response;
    }
    catch (e) {
      console.error("Failed to fetch book details for book ids: ", ids, " : ", e);
      return bookDetails.value;
    }
    finally {
      profileFavoriteBooksLoading.value = false;
    }
  };

  return {
    featuredBooks,
    subjectBooks,
    searchedBooks,
    bookDetails,
    subjects: BOOK_SUBJECTS,
    featuredLoading,
    subjectBookLoading,
    searchLoading,
    bookDetailsLoading,
    profileFavoriteBooks,
    profileFavoriteBooksLoading,
    HOMEPAGE_MAX_BOOKS: MAX_BOOKS_PER_PAGE,
    fetchFeaturedBooks,
    fetchSubjectBooks,
    fetchProfileFavoriteBooks,
    searchBook,
    getBookDetails,
  };
});
