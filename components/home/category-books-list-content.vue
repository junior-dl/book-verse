<script setup lang="ts">
import type { HomeFeed } from "~/shared/types";

const props = defineProps<{
  sections: HomeFeed["sections"];
  loading?: boolean;
}>();
</script>

<template>
  <div class="mx-4">
    <template v-if="props.loading">
      <div v-for="i in 3" :key="i" class="mb-10">
        <div class="skeleton my-5 h-10 w-48" />
        <BookGrid :books="[]" loading :skeletons="6" />
      </div>
    </template>

    <section v-for="section in props.sections" v-else :key="section.slug" class="mb-10">
      <div class="my-5 flex items-end justify-between">
        <h2 class="text-3xl font-bold">
          {{ section.name }}
        </h2>
        <NuxtLink :to="`/subject/${section.slug}`" class="link link-hover">
          See all
        </NuxtLink>
      </div>
      <BookGrid :books="section.books" />
    </section>
  </div>
</template>
