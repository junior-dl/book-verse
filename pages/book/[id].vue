<script setup lang="ts">
import type { Book } from "~/shared/types";

const route = useRoute();
const { data: book, error } = await useFetch<Book>(() => `/api/book/${route.params.id}`);

useHead(() => ({ title: book.value ? `${book.value.title} · BookVerse` : "BookVerse" }));
</script>

<template>
  <div>
    <div v-if="error" class="m-5">
      <BookEmptyState title="Book not found" message="This book may have been merged with another edition." />
    </div>
    <template v-else-if="book">
      <BookCardDetailsHeroSection :book="book" />
      <BookCardDetailsAboutSection :description="book.description" />
      <BookCardDetailsSubjectSection :subjects="book.subjects" />
      <BookCardDetailsBookInformation :book="book" />
    </template>
  </div>
</template>
