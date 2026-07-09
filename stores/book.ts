import type { Book } from "#imports";

export const useBookStore = defineStore("books", () => {
  const featuredBooks = ref<Book[]>([]);
  const subjectBooks = ref<Record<string, Book[]>>({});
  const searchedBooks = ref<Book[]>([]);
  const searchLoading = ref(false);
  const isLoading = ref(false);

  const subjects = [
    "Action",
    "Fantasy",
    "Fiction",
    "Romance",
    "Mystery",
    "Science Fiction",
  ];

  const fetchFeaturedBooks = async () => {
    try {
      const books = await $fetch<{
        source: string;
        data: Book[];
      }>("api/books", {
        method: "GET",
        query: {
          limit: 5,
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
      isLoading.value = false;
    }
  };

  const fetchSubjectBooks = async (subject: string) => {
    try {
      const books = await $fetch<{
        source: string;
        data: Book[];
      }>("/api/books/subject", {
        method: "GET",
        query: {
          subject,
          limit: 5,
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
      isLoading.value = false;
    }
  };

  const searchBook = async (query: string) => {
    searchLoading.value = true;
    try {
      const response = await $fetch<{
        source: string;
        data: Book[];
      }>("/api/books/search", {
        query: { q: query },
      });
      searchedBooks.value = response?.data;
      return response;
    }
    catch (e) {
      console.error("Failed to fetch books for ", query, ": ", e);
      return searchedBooks.value;
    }
    finally {
      searchLoading.value = false;
    }
  };

  return {
    featuredBooks,
    subjectBooks,
    searchedBooks,
    subjects,
    searchLoading,
    fetchFeaturedBooks,
    fetchSubjectBooks,
    searchBook,
  };
});
