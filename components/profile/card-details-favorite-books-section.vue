<script lang="ts" setup>
import { BOOK } from "~/constants/book";

const props = defineProps<{
  profileId: string;
}>();

const favoritesStore = useFavoritesStore();
const rawFavoritedBooks = computed(() => favoritesStore.favoriteBooks);

watch(
  () => props.profileId,
  async (id) => {
    if (!id)
      return;

    await favoritesStore.fetchFavoriteBooksByProfile(id);
  },
  { immediate: true },
);

const booksStore = useBookStore();
const books = computed(() => booksStore.profileFavoriteBooks);
const loading = computed(() => booksStore.profileFavoriteBooksLoading);

watch(
  rawFavoritedBooks,
  async (favorites) => {
    if (!favorites?.length)
      return;

    const ids = favorites.map(f => f.bookId);
    await booksStore.fetchProfileFavoriteBooks(ids);
  },
);

const MAX_DISPLAYED_BOOKS = 6;
const { DEFAULT_BOOK_COVER } = BOOK;

const router = useRouter();

function openBook(bookId?: string) {
  if (!bookId)
    return;
  router.push(`/book/${bookId}`);
}
</script>

<template>
  <!-- <div class="card bg-base-200 contain m-5 p-5 shadow-sm flex flex-col gap-2"> -->
  <div class="card contain m-5 flex flex-col gap-5">
    <div class="flex flex-row justify-between">
      <h1 class="font-extrabold text-2xl">
        Favorite books
      </h1>
      <NuxtLink to="/profile/favorite">
        View all
      </NuxtLink>
    </div>

    <div v-if="loading" class="italic">
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-1 lg:grid-cols-6">
        <div
          v-for="i in 6"
          :key="i"
          class="flex flex-col gap-4"
        >
          <div class="skeleton h-100 w-full" />
          <div class="skeleton h-8 w-full" />
          <div class="skeleton h-8 w-28" />
        </div>
      </div>
    </div>
    <div v-else class="italic">
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-1 lg:grid-cols-6">
        <div v-for="book in books?.slice(0, MAX_DISPLAYED_BOOKS)" :key="book.id" class="flex-1">
          <div class="card bg-base-100 w-auto shadow-sm">
            <!-- Image -->
            <figure class="h-80 overflow-hidden">
              <img
                :src="book.coverUrl ?? DEFAULT_BOOK_COVER"
                alt="Shoes"

                class="w-full h-full object-contain"
              >
            </figure>

            <!-- Content -->
            <div class="card-body">
              <h2 class="card-title line-clamp-1">
                {{ book.title }}
              </h2>

              <div class="flex flex-row">
                <div v-for="(author, index) in book.author" :key="index">
                  {{ typeof author === 'string' ? author : author.name }}<span v-if="index < book.author.length - 1">&nbsp;,&nbsp;</span>
                </div>
              </div>

              <!-- Button -->
              <div class="card-actions">
                <button class="btn btn-primary w-full" @click="openBook(book.id)">
                  Read Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
