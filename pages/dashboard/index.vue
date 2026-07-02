<script lang="ts" setup>
// const books = await $fetch("/api/books/", {
//   method: "GET",
//   query: {
//     limit: 5,
//   },
// });

const bookStore = useBookStore();
const featured = computed(() => bookStore.featuredBooks);

onMounted(async () => {
  await bookStore.fetchFeaturedBooks();
});
</script>

<template>
  <div>
    <!-- <div v-if="pending">
      Loading...
    </div>
    <div v-else-if="error">
      Error loading books
    </div> -->

    <ul>
      <li v-for="book in featured " :key="book.id">
        {{ book.title }}
      </li>
    </ul>
  </div>
</template>
