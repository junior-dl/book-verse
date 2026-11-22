<script lang="ts" setup>
import type { HomeFeed } from "~/shared/types";

// Rendered on the server in a single request — no client-side waterfall.
const { data, status } = await useFetch<HomeFeed>("/api/home");
const loading = computed(() => status.value === "pending");
</script>

<template>
  <div>
    <HomeTrendingBooksCarousel :books="data?.trending ?? []" :loading="loading" />
    <HomeCategoryBooksListContent :sections="data?.sections ?? []" :loading="loading" />
  </div>
</template>
