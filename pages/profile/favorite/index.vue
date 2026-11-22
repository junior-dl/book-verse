<script lang="ts" setup>
const profileStore = useProfileStore();
const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();

watch(() => authStore.user?.id, async (id) => {
  if (id)
    await profileStore.fetchProfile(id);
}, { immediate: true });

watch(() => profileStore.profileDetails?.id, async (id) => {
  if (id)
    await favoritesStore.fetchFavoriteBooksByProfile(id);
}, { immediate: true });
</script>

<template>
  <div class="m-5 flex flex-col gap-5">
    <h1 class="text-2xl font-extrabold">
      Favorite books
    </h1>
    <BookGrid
      v-if="favoritesStore.loading || favoritesStore.favoriteBooks.length"
      :books="favoritesStore.favoriteBooks"
      :loading="favoritesStore.loading"
    />
    <BookEmptyState v-else title="No favorites yet" message="Tap “Save” on any book to keep it here." />
  </div>
</template>
