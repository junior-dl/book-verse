<script setup lang="ts">
import { BOOK } from "~/constants/book";

const route = useRoute();
const bookStore = useBookStore();
const { DEFAULT_BOOK_COVER } = BOOK;

const book = computed(() => bookStore.bookDetails);
// const loading = computed(() => bookStore.bookDetailsLoading);

const bookId = computed(() => route.params.id as string);

onMounted(async () => {
  await bookStore.getBookDetails(bookId.value);
});
</script>

<template>
  <div>
    <!-- Section 1 -->
    <BookCardDetailsHeroSection :id="bookId" :title="book?.title" :authors="book?.author" :cover-url="book?.coverUrl ?? DEFAULT_BOOK_COVER" :download-links="book?.downloadLinks" />

    <BookCardDetailsAboutSection :summary="book?.summary" />

    <BookCardDetailsSubjectSection :subjects="book?.subjects" />

    <BookCardDetailsBookInformation :authors="book?.author" :language="book?.language" :source="book?.source" :source-download-count="book?.sourceDownloadCount ?? 0" :download-count="book?.downloadCount ?? 0" />
  </div>
</template>
