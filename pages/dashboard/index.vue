<script lang="ts" setup>
const bookStore = useBookStore();
const authStore = useAuthStore();
const featured = computed(() => bookStore.featuredBooks);
const user = computed(() => authStore.user);

onMounted(async () => {
  await bookStore.fetchFeaturedBooks();
});
</script>

<template>
  <div>
    {{ user }}
    <ul>
      <li v-for="book in featured " :key="book.id">
        {{ book.title }}
      </li>
    </ul>
  </div>
</template>
