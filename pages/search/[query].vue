<script lang="ts" setup>
import type { BookCard, Paged } from "~/shared/types";

import { SEARCH_PAGE_SIZE } from "~/constants/book";

const route = useRoute();
const router = useRouter();
const query = computed(() => route.params.query as string);
const page = computed(() => Number(route.query.page ?? 1));

const { data, status } = await useFetch<Paged<BookCard>>("/api/book/search", {
  query: { q: query, page, pageSize: SEARCH_PAGE_SIZE },
});

function goTo(p: number) {
  router.push({ query: { ...route.query, page: p } });
}
</script>

<template>
  <div class="flex flex-col gap-5 p-5">
    <div class="flex flex-row flex-wrap justify-between gap-2">
      <p>Search for: <span class="font-bold">{{ query }}</span></p>
      <p>Results: {{ data?.total ?? 0 }}</p>
    </div>
    <hr>

    <BookGrid v-if="status === 'pending' || data?.items.length" :books="data?.items ?? []" :loading="status === 'pending'" />
    <BookEmptyState
      v-else
      title="No results yet"
      message="We don't have this book yet — we've queued it up and will look across our sources. Check back in a little while."
    />

    <BookPagination v-if="data" :page="data.page" :total="data.total" :page-size="data.pageSize" @change="goTo" />
  </div>
</template>
