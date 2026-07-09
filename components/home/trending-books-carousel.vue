<script lang="ts" setup>
import type { Book } from "~/shared/types";

const props = defineProps <{
  books: Book[];
  defaultCover: string;
}>();

const carouselConfig = {
  itemsToShow: 1,
  wrapAround: true,
};
</script>

<template>
  <div class="carousel-bg px-2 py-2">
    <Carousel :autoplay="2500" v-bind="carouselConfig" class="w-full">
      <Slide v-for="book in props.books" :key="book.id" class="w-full py-8 px-10">
        <div class="flex flex-row gap-5 w-full">
          <!-- Image -->
          <div class="h-80 w-65 overflow-hidden bg-primary rounded-lg">
            <img
              :src="book.coverUrl ?? props.defaultCover" :alt="book.title"
              class="w-full h-full object-contain"
            >
          </div>
          <!-- Info -->
          <div class="w-full flex flex-col gap-5">
            <h2 class="text-4xl font-bold">
              {{ book.title }}
            </h2>

            <div>
              <p class="line-clamp-2">
                {{ book.summary[0] }}
              </p>
            </div>

            <div v-for="(author, index) in book.author" :key="index">
              {{ typeof author === 'string' ? author : author.name }}<span v-if="index < book.author.length - 1"> , </span>
            </div>
          </div>
        </div>
      </Slide>
      <template #addons>
        <Navigation />
        <Pagination />
      </template>
    </Carousel>
  </div>
</template>
