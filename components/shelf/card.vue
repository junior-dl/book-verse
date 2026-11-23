<script setup lang="ts">
import type { ShelfSummary } from "~/shared/types";

const props = defineProps<{ shelf: ShelfSummary }>();
</script>

<template>
  <NuxtLink :to="`/shelf/${props.shelf.id}`" class="card group bg-base-200 shadow-sm transition hover:shadow-md">
    <!-- Up to 4 covers as a collage -->
    <div class="grid aspect-[4/3] grid-cols-4 gap-1 overflow-hidden rounded-t-box bg-base-300 p-2">
      <div v-for="(c, i) in props.shelf.covers" :key="i" class="h-full">
        <BookCover :src="c.coverUrl" :title="c.title" />
      </div>
      <div v-if="!props.shelf.covers.length" class="col-span-4 flex items-center justify-center opacity-50">
        <Icon name="tabler:books" size="48" />
      </div>
    </div>
    <div class="card-body gap-1 p-4">
      <div class="flex items-center justify-between gap-2">
        <h3 class="truncate font-bold group-hover:underline">
          {{ props.shelf.name }}
        </h3>
        <Icon v-if="props.shelf.isPublic" name="tabler:world" size="16" class="shrink-0 opacity-60" aria-label="Public shelf" />
      </div>
      <p class="text-sm opacity-70">
        {{ props.shelf.bookCount }} {{ props.shelf.bookCount === 1 ? "book" : "books" }}
      </p>
    </div>
  </NuxtLink>
</template>
