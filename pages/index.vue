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

const carouselConfig = {
  itemsToShow: 1,
  wrapAround: true,
};
</script>

<template>
  <div>
    <Carousel :autoplay="2500" v-bind="carouselConfig">
      <Slide v-for="book in featuredBooks" :key="book.id">
        <div class="carousel__item">
          <div>
            <img
              :src="book.coverUrl ?? DEFAULT_BOOK_COVER" :alt="book.title"
              class="w-48 h-72 object-cover"
            >
          </div>
          {{ book.title }}
        </div>
      </Slide>

      <template #addons>
        <Navigation />
        <Pagination />
      </template>
    </Carousel>

    <!-- to replace -->

    <div
      v-for="subject in subjects"
      :key="subject"
      class="mb-8"
    >
      <h2 class="text-2xl font-bold mb-4">
        {{ subject }}
      </h2>

      <div v-for="book in subjectBooks[subject]" :key="book.id">
        {{ book.title }}
      </div>
    </div>
  </div>
</template>
