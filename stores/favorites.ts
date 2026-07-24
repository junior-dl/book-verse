import type { Favorite } from "#imports";
import type { CreateFavoritesDTO, ValidateFavoritesDTO } from "~/shared/dto";

export const useFavoritesStore = defineStore("favorites", () => {
  const isFavorite = ref(false);
  const favoriteBooks = ref<Favorite[] | undefined>([]);
  const loading = ref(false);

  const addBookToFavorites = async (data: CreateFavoritesDTO) => {
    loading.value = true;
    try {
      const result = await $fetch<boolean>(`/api/favorites`, { method: "POST", body: data });
      isFavorite.value = result;
      return result;
    }
    catch (e) {
      console.error("Failed to favorite book at store: ", e);
      return isFavorite.value;
    }
    finally {
      loading.value = false;
    }
  };

  const checkBookFavorites = async (bookId: string, profileId: string) => {
    loading.value = true;
    try {
      const result = await $fetch(`/api/favorites/book/`, { method: "GET", query: {
        bookId,
        profileId,
      } });
      isFavorite.value = (result?.length ?? 0) > 0;
      return result;
    }
    catch (e) {
      console.error("Failed to validate favorites: ", e);
      return isFavorite.value;
    }
    finally {
      loading.value = false;
    }
  };

  const deleteBookFavorites = async (data: ValidateFavoritesDTO) => {
    loading.value = true;
    try {
      const result = await $fetch("/api/favorites", { method: "DELETE", body: data });

      if (result) {
        isFavorite.value = false;
      }

      return result;
    }
    catch (e) {
      console.error("Failed to delete favorites at store: ", e);
      return isFavorite.value;
    }
    finally {
      loading.value = false;
    }
  };

  const fetchFavoriteBooksByProfile = async (profileId: string) => {
    loading.value = true;
    try {
      const result = await $fetch(`/api/favorites/profile/${profileId}`, { method: "GET" });
      favoriteBooks.value = result;
      return result;
    }
    catch (e) {
      console.error("Failed to fetch favorited books: ", e);
      return favoriteBooks.value;
    }
    finally {
      loading.value = false;
    }
  };

  return {
    isFavorite,
    favoriteBooks,
    loading,
    addBookToFavorites,
    checkBookFavorites,
    deleteBookFavorites,
    fetchFavoriteBooksByProfile,
  };
});
