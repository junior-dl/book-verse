<script lang="ts" setup>
import type { Book } from "~/shared/types";

const props = defineProps <{
  books: Book[];
  defaultCover: string;
  loading?: boolean;
}>();

const carouselConfig = {
  itemsToShow: 1,
  wrapAround: true,
};
</script>

<template>
  <div>
    <div class="carousel-bg px-2 py-2">
      <!-- Loading -->
      <div class="flex mx-10 flex-row gap-4" v-if="loading">
        <div class="skeleton w-65 h-80" />
        <div class="flex w-full flex-col gap-4">
          <div class="skeleton h-10 w-1/2" />
          <div class="skeleton h-4 w-full" />
          <div class="skeleton h-4 w-full" />
          <div class="skeleton h-4 w-1/3" />
        </div>
      </div>

      <!-- Carousel -->
      <Carousel :autoplay="2500" v-bind="carouselConfig" class="w-full" v-else>
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
  </div>
</template>
