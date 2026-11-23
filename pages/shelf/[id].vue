<script setup lang="ts">
import type { ShelfDetail } from "~/shared/types";

const route = useRoute();
const store = useShelvesStore();
const modal = ref<{ open: () => void } | null>(null);
const removing = ref<string | null>(null);
const copied = ref(false);

const { data: shelf, error, refresh } = await useFetch<ShelfDetail>(() => `/api/shelves/${route.params.id}`);

async function removeBook(workId: string) {
  removing.value = workId;
  try {
    await store.removeBook(shelf.value!.id, workId);
    await refresh();
  }
  finally {
    removing.value = null;
  }
}

async function deleteShelf() {
  // eslint-disable-next-line no-alert
  if (!shelf.value || !window.confirm(`Delete “${shelf.value.name}”? The books stay in BookVerse.`))
    return;
  await store.remove(shelf.value.id);
  await navigateTo("/profile/shelves");
}

async function copyLink() {
  await navigator.clipboard.writeText(window.location.href);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

useHead(() => ({ title: shelf.value ? `${shelf.value.name} · BookVerse` : "Shelf · BookVerse" }));
</script>

<template>
  <div class="m-5 flex flex-col gap-5">
    <BookEmptyState v-if="error" title="Shelf not found" message="It may be private or deleted." />

    <template v-else-if="shelf">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <NuxtLink v-if="shelf.isOwner" to="/profile/shelves" class="link link-hover text-sm opacity-70">
            ← All shelves
          </NuxtLink>
          <h1 class="break-words text-3xl font-extrabold">
            {{ shelf.name }}
          </h1>
          <p v-if="shelf.description" class="max-w-2xl opacity-80">
            {{ shelf.description }}
          </p>
          <p class="text-sm opacity-60">
            {{ shelf.bookCount }} {{ shelf.bookCount === 1 ? "book" : "books" }} · {{ shelf.isPublic ? "Public" : "Private" }}
          </p>
        </div>

        <div v-if="shelf.isOwner" class="flex flex-wrap gap-2">
          <button v-if="shelf.isPublic" class="btn btn-sm" @click="copyLink">
            <Icon :name="copied ? 'tabler:check' : 'tabler:link'" size="16" /> {{ copied ? "Copied" : "Copy link" }}
          </button>
          <button class="btn btn-sm" @click="modal?.open()">
            <Icon name="tabler:pencil" size="16" /> Edit
          </button>
          <button class="btn btn-sm btn-error btn-outline" @click="deleteShelf">
            <Icon name="tabler:trash" size="16" /> Delete
          </button>
        </div>
      </div>

      <div v-if="shelf.books.length" class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
        <div v-for="book in shelf.books" :key="book.id" class="flex flex-col gap-2">
          <BookGrid :books="[book]" class="!grid-cols-1" />
          <button v-if="shelf.isOwner" class="btn btn-xs btn-ghost" :disabled="removing === book.id" @click="removeBook(book.id)">
            <Icon name="tabler:x" size="14" /> Remove
          </button>
        </div>
      </div>
      <BookEmptyState v-else title="This shelf is empty" message="Open any book and use “Add to shelf”." />

      <ShelfFormModal v-if="shelf.isOwner" ref="modal" :shelf="shelf" @saved="() => refresh()" />
    </template>
  </div>
</template>
