<script lang="ts" setup>
import type { Book, BookFormat } from "~/shared/types";

const props = defineProps<{ book: Book }>();

const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();
const isFavorite = computed(() => favoritesStore.isFavorite);
const loading = computed(() => favoritesStore.loading);

const FORMAT_LABELS: Record<string, string> = {
  epub: "EPUB",
  pdf: "PDF",
  mobi: "Kindle (MOBI)",
  azw3: "Kindle (AZW3)",
  txt: "Plain text",
  html: "Web page",
  audio: "Audiobook",
};

const readOnline = computed(() => props.book.formats.find(f => f.format === "html"));
const downloads = computed<BookFormat[]>(() => props.book.formats.filter(f => f.format !== "html"));

watch(
  () => [authStore.user?.id, props.book.id] as const,
  async ([userId, workId]) => {
    if (userId && workId)
      await favoritesStore.checkBookFavorites(workId);
  },
  { immediate: true },
);

async function toggleFavorite() {
  if (!authStore.user)
    return navigateTo("/sign-in");
  if (isFavorite.value)
    await favoritesStore.deleteBookFavorites(props.book.id);
  else
    await favoritesStore.addBookToFavorites(props.book.id);
}
</script>

<template>
  <div class="card bg-base-300 m-5 flex flex-col gap-6 p-5 shadow-sm md:flex-row">
    <div class="h-72 w-48 shrink-0">
      <BookCover :src="props.book.coverUrl" :title="props.book.title" :author="props.book.authors.map(a => a.name).join(', ')" size="lg" />
    </div>

    <div class="flex w-full flex-col justify-between gap-4">
      <div class="flex flex-col gap-2">
        <h1 class="text-4xl font-extrabold">
          {{ props.book.title }}
        </h1>
        <p v-if="props.book.subtitle" class="text-xl opacity-80">
          {{ props.book.subtitle }}
        </p>
        <div v-if="props.book.authors.length" class="flex flex-wrap items-center gap-1">
          <span>by</span>
          <NuxtLink
            v-for="(author, i) in props.book.authors"
            :key="author.slug"
            :to="`/author/${author.slug}`"
            class="link link-hover font-semibold"
          >
            {{ author.name }}<span v-if="i < props.book.authors.length - 1">,</span>
          </NuxtLink>
        </div>
        <div class="flex flex-wrap gap-2">
          <span v-if="props.book.firstPublishedYear" class="badge badge-ghost">{{ props.book.firstPublishedYear }}</span>
          <span v-if="props.book.isPublicDomain" class="badge badge-success">Free to read</span>
          <span v-else class="badge badge-outline">In print — no free download</span>
        </div>
      </div>

      <div class="card-actions">
        <a v-if="readOnline" class="btn btn-primary" :href="readOnline.url" target="_blank" rel="noopener noreferrer">
          Read online
        </a>

        <div v-if="downloads.length" class="dropdown dropdown-hover">
          <div tabindex="0" role="button" class="btn">
            <Icon name="tabler:download" size="20" /> Download
          </div>
          <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-10 w-64 p-2 shadow-sm">
            <li v-for="f in downloads" :key="`${f.format}-${f.source}`">
              <a :href="f.url" target="_blank" rel="noopener noreferrer">
                {{ FORMAT_LABELS[f.format] ?? f.format }}
                <span class="text-xs opacity-60">· {{ f.source }}</span>
              </a>
            </li>
          </ul>
        </div>

        <button class="btn btn-accent" :disabled="loading" @click="toggleFavorite">
          <span v-if="loading" class="loading loading-spinner loading-sm" />
          <Icon v-else :name="isFavorite ? 'tabler:heart-filled' : 'tabler:heart'" size="20" />
          {{ isFavorite ? "Saved" : "Save" }}
        </button>
      </div>
    </div>
  </div>
</template>
