<script lang="ts" setup>
import type { HomeFeed } from "~/shared/types";

const props = defineProps <{
  books: HomeFeed["trending"];
  loading?: boolean;
}>();

const router = useRouter();

const carouselConfig = {
  itemsToShow: 1,
  wrapAround: true,
};

function openBook(slug: string) {
  router.push(`/book/${slug}`);
}
</script>

<template>
  <div>
    <div class="carousel-bg px-2 py-2">
      <!-- Loading -->
      <div v-if="loading" class="mx-4 flex flex-col items-center gap-4 sm:mx-10 sm:flex-row sm:items-start">
        <div class="skeleton h-60 w-40 shrink-0 sm:h-80 sm:w-56" />
        <div class="flex w-full flex-col gap-4">
          <div class="skeleton h-10 w-1/2" />
          <div class="skeleton h-4 w-full" />
          <div class="skeleton h-4 w-full" />
          <div class="skeleton h-4 w-1/3" />
        </div>
      </div>

      <!-- Carousel -->
      <Carousel v-else :autoplay="2500" v-bind="carouselConfig" class="w-full">
        <Slide v-for="book in props.books" :key="book.id" class="w-full px-4 py-6 sm:px-10 sm:py-8">
          <div class="flex w-full flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
            <!-- Image -->
            <div class="h-60 w-40 shrink-0 sm:h-80 sm:w-56">
              <BookCover :src="book.coverUrl" :title="book.title" :author="book.authors.map(a => a.name).join(', ')" size="lg" />
            </div>
            <!-- Left -->
            <div class="flex w-full min-w-0 flex-col gap-5 sm:gap-10">
              <!-- Info -->

              <div class="flex flex-col gap-5">
                <div>
                  <p class="text-secondary-content text-sm">
                    TRENDING
                  </p>
                  <h2 class="line-clamp-3 text-2xl font-bold sm:text-4xl">
                    {{ book.title }}
                  </h2>
                </div>
                <p v-if="book.description" class="line-clamp-3">
                  {{ book.description }}
                </p>
                <div class="flex flex-wrap justify-center gap-1 sm:justify-start">
                  <NuxtLink v-for="author in book.authors" :key="author.slug" :to="`/author/${author.slug}`" class="link link-hover">
                    {{ author.name }}
                  </NuxtLink>
                </div>
              </div>

              <!-- Action Button -->
              <div class="card-actions justify-center sm:justify-start">
                <button class="btn btn-primary w-full sm:w-50" @click="openBook(book.slug)">
                  Read Now
                </button>
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
