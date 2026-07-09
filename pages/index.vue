<script lang="ts" setup>
import { BOOK } from "~/constants/book";

const { DEFAULT_BOOK_COVER } = BOOK;

const bookStore = useBookStore();
const subjects: string[] = bookStore.subjects;

const featuredBooks = computed(() => bookStore.featuredBooks);
const featuredLoading = computed(() => bookStore.featuredLoading);
const subjectBooks = computed(() => bookStore.subjectBooks);
const subjectBooksLoading = computed(() => bookStore.subjectBookLoading);

onMounted(async () => {
  await bookStore.fetchFeaturedBooks();
  await Promise.all(subjects.map(subject => bookStore.fetchSubjectBooks(subject)));
});
</script>

<template>
  <div>
    <HomeTrendingBooksCarousel :books="featuredBooks" :default-cover="DEFAULT_BOOK_COVER" :loading="featuredLoading" />

    <HomeCategoryBooksListContent :subjects="subjects" :books="subjectBooks" :default-cover="DEFAULT_BOOK_COVER" :loading="subjectBooksLoading" />
  </div>
</template>
