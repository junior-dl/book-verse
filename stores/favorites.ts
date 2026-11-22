import type { BookCard } from "~/shared/types";

export const useFavoritesStore = defineStore("favorites", () => {
  const isFavorite = ref(false);
  const favoriteBooks = ref<BookCard[]>([]);
  const loading = ref(false);

  async function run<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    loading.value = true;
    try {
      return await fn();
    }
    catch (e) {
      console.error("Favorites request failed:", e);
      return fallback;
    }
    finally {
      loading.value = false;
    }
  }

  const addBookToFavorites = (workId: string) => run(async () => {
    await $fetch("/api/favorites", { method: "POST", body: { workId } });
    isFavorite.value = true;
    return true;
  }, false);

  const deleteBookFavorites = (workId: string) => run(async () => {
    await $fetch("/api/favorites", { method: "DELETE", body: { workId } });
    isFavorite.value = false;
    return true;
  }, false);

  const checkBookFavorites = (workId: string) => run(async () => {
    const res = await $fetch<{ isFavorite: boolean }>("/api/favorites/book", { query: { workId } });
    isFavorite.value = res.isFavorite;
    return res.isFavorite;
  }, false);

  const fetchFavoriteBooksByProfile = (profileId: string) => run(async () => {
    favoriteBooks.value = await $fetch<BookCard[]>(`/api/favorites/profile/${profileId}`);
    return favoriteBooks.value;
  }, [] as BookCard[]);

  return {
    isFavorite,
    favoriteBooks,
    loading,
    addBookToFavorites,
    deleteBookFavorites,
    checkBookFavorites,
    fetchFavoriteBooksByProfile,
  };
});
