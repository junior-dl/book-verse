<script lang="ts" setup>
const books = await $fetch("/api/books/search", {
  query: { q: "moby" },
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
      <li v-for="book in books?.data" :key="book.id">
        {{ book.title }}
      </li>
    </ul>
  </div>
</template>
