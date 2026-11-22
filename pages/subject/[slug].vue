<script lang="ts" setup>
import type { BookCard, Paged, SubjectRef } from "~/shared/types";

import { SEARCH_PAGE_SIZE } from "~/constants/book";

const route = useRoute();
const router = useRouter();
const slug = computed(() => route.params.slug as string);
const page = computed(() => Number(route.query.page ?? 1));

const { data, status, error } = await useFetch<Paged<BookCard> & { subject: SubjectRef }>(
  () => `/api/subject/${slug.value}`,
  { query: { page, pageSize: SEARCH_PAGE_SIZE } },
);

function goTo(p: number) {
  router.push({ query: { ...route.query, page: p } });
}
</script>

<template>
  <div class="flex flex-col gap-5 p-5">
    <div class="flex flex-row items-end justify-between">
      <h1 class="text-3xl font-bold">
        {{ data?.subject.name ?? slug }}
      </h1>
      <p>{{ data?.total ?? 0 }} books</p>
    </div>
    <hr>

    <BookEmptyState v-if="error" title="Unknown subject" />
    <BookGrid v-else-if="status === 'pending' || data?.items.length" :books="data?.items ?? []" :loading="status === 'pending'" />
    <BookEmptyState v-else />

    <BookPagination v-if="data" :page="data.page" :total="data.total" :page-size="data.pageSize" @change="goTo" />
  </div>
</template>
