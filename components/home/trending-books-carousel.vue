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
      <div v-if="loading" class="flex mx-10 flex-row gap-4">
        <div class="skeleton w-65 h-80" />
        <div class="flex w-full flex-col gap-4">
          <div class="skeleton h-10 w-1/2" />
          <div class="skeleton h-4 w-full" />
          <div class="skeleton h-4 w-full" />
          <div class="skeleton h-4 w-1/3" />
        </div>
      </div>

      <!-- Carousel -->
      <Carousel v-else :autoplay="2500" v-bind="carouselConfig" class="w-full">
        <Slide v-for="book in props.books" :key="book.id" class="w-full py-8 px-10">
          <div class="flex flex-row gap-5 w-full">
            <!-- Image -->
            <div class="h-80 w-56 shrink-0">
              <BookCover :src="book.coverUrl" :title="book.title" :author="book.authors.map(a => a.name).join(', ')" size="lg" />
            </div>
            <!-- Left -->
            <div class="w-full flex flex-col gap-10">
              <!-- Info -->

              <div class="flex flex-col gap-5">
                <div>
                  <p class="text-secondary-content text-sm">
                    TRENDING
                  </p>
                  <h2 class="text-4xl font-bold">
                    {{ book.title }}
                  </h2>
                </div>
                <p v-if="book.description" class="line-clamp-3">
                  {{ book.description }}
                </p>
                <div class="flex flex-wrap gap-1">
                  <NuxtLink v-for="author in book.authors" :key="author.slug" :to="`/author/${author.slug}`" class="link link-hover">
                    {{ author.name }}
                  </NuxtLink>
                </div>
              </div>

              <!-- Action Button -->
              <div class="card-actions">
                <button class="btn btn-primary w-50" @click="openBook(book.slug)">
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
