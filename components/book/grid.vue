<script setup lang="ts">
import type { BookCard } from "~/shared/types";

const props = withDefaults(defineProps<{
  books: BookCard[];
  loading?: boolean;
  skeletons?: number;
}>(), { loading: false, skeletons: 12 });
</script>

<template>
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-6">
    <template v-if="props.loading">
      <div v-for="i in props.skeletons" :key="i" class="flex flex-col gap-3">
        <div class="skeleton aspect-[2/3] w-full" />
        <div class="skeleton h-5 w-full" />
        <div class="skeleton h-4 w-24" />
      </div>
    </template>

    <NuxtLink
      v-for="book in props.books"
      v-else
      :key="book.id"
      :to="`/book/${book.slug}`"
      class="group flex flex-col gap-2"
    >
      <div class="aspect-[2/3] w-full shadow-sm transition group-hover:scale-[1.03]">
        <BookCover :src="book.coverUrl" :title="book.title" :author="book.authors.map(a => a.name).join(', ')" />
      </div>
      <p class="line-clamp-2 font-semibold leading-tight">
        {{ book.title }}
      </p>
      <p class="line-clamp-1 text-sm opacity-70">
        {{ book.authors.map(a => a.name).join(", ") || "Unknown author" }}
      </p>
    </NuxtLink>
  </div>
</template>
