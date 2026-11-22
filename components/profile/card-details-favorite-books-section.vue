<script lang="ts" setup>
const props = defineProps<{ profileId: string }>();

const favoritesStore = useFavoritesStore();
const books = computed(() => favoritesStore.favoriteBooks.slice(0, 6));

watch(() => props.profileId, async (id) => {
  if (id)
    await favoritesStore.fetchFavoriteBooksByProfile(id);
}, { immediate: true });
</script>

<template>
  <div class="m-5 flex flex-col gap-5">
    <div class="flex flex-row justify-between">
      <h1 class="text-2xl font-extrabold">
        Favorite books
      </h1>
      <NuxtLink to="/profile/favorite" class="link link-hover">
        View all
      </NuxtLink>
    </div>
    <BookGrid v-if="favoritesStore.loading || books.length" :books="books" :loading="favoritesStore.loading" :skeletons="6" />
    <p v-else class="italic opacity-70">
      No favorites yet.
    </p>
  </div>
</template>
