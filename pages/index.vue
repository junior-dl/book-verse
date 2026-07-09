<script lang="ts" setup>
import { BOOK } from "~/constants/book";

const { DEFAULT_BOOK_COVER } = BOOK;

const bookStore = useBookStore();
const subjects: string[] = bookStore.subjects;

const featuredBooks = computed(() => bookStore.featuredBooks);
const subjectBooks = computed(() => bookStore.subjectBooks);

onMounted(async () => {
  await bookStore.fetchFeaturedBooks();
  await Promise.all(subjects.map(subject => bookStore.fetchSubjectBooks(subject)));
});
</script>

<template>
  <div>
    <HomeTrendingBooksCarousel :books="featuredBooks" :default-cover="DEFAULT_BOOK_COVER" />

    <HomeCategoryBooksListContent :subjects="subjects" :books="subjectBooks" :default-cover="DEFAULT_BOOK_COVER" />
  </div>
</template>
