<script lang="ts" setup>
import type { AuthorPage } from "~/shared/types";

const route = useRoute();
const { data: author, error } = await useFetch<AuthorPage>(() => `/api/author/${route.params.slug}`);

const lifespan = computed(() => {
  const a = author.value;
  if (!a || (!a.birthYear && !a.deathYear))
    return null;
  return `${a.birthYear ?? "?"} – ${a.deathYear ?? ""}`.trim();
});

useHead(() => ({ title: author.value ? `${author.value.name} · BookVerse` : "BookVerse" }));
</script>

<template>
  <div class="flex flex-col gap-6 p-5">
    <BookEmptyState v-if="error" title="Author not found" />
    <template v-else-if="author">
      <div class="card bg-base-300 flex flex-col gap-6 p-6 shadow-sm md:flex-row">
        <div class="avatar">
          <div class="w-36 rounded-xl bg-base-100">
            <img v-if="author.photoUrl" :src="author.photoUrl" :alt="author.name">
            <Icon v-else name="tabler:user" size="144" class="opacity-40" />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <h1 class="text-4xl font-extrabold">
            {{ author.name }}
          </h1>
          <p v-if="lifespan" class="opacity-70">
            {{ lifespan }}
          </p>
          <p v-if="author.bio" class="max-w-3xl leading-relaxed">
            {{ author.bio }}
          </p>
          <p v-else-if="author.bio === null" class="italic opacity-60">
            A short biography is on its way.
          </p>
        </div>
      </div>

      <h2 class="text-2xl font-bold">
        Books ({{ author.books.length }})
      </h2>
      <BookGrid :books="author.books" />
    </template>
  </div>
</template>
