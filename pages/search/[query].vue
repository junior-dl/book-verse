<script lang="ts" setup>
const route = useRoute();
const bookStore = useBookStore();

const query = computed(() => route.params.query as string);
const books = computed(() => bookStore.searchedBooks);
const searchLoading = computed(() => bookStore.searchLoading);

onMounted(async () => {
  await bookStore.searchBook(query.value);
});
</script>

<template>
  <div>
    <p>Search for: {{ query }}</p>
    <hr>
    <div v-if="searchLoading" class="loading loading-spinner loading-md" />
    <div v-for="book in books" v-else :key="book.id">
      {{ book.title }}
    </div>
  </div>
</template>
