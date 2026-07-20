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

const { DEFAULT_BOOK_COVER } = BOOK;

// Routing
const router = useRouter();
function openBook(bookId?: string) {
  if (!bookId)
    return;
  router.push(`/book/${bookId}`);
}

// Pagination
const currentPage = ref(1);
const booksPerPage = 12;

const totalPages = computed(() => Math.ceil(books.value.length / booksPerPage));
const paginatedBooks = computed(() => {
  const start = (currentPage.value - 1) * booksPerPage;
  return books.value.slice(start, start + booksPerPage);
});
</script>

<template>
  <!-- <div class="card bg-base-200 contain m-5 p-5 shadow-sm flex flex-col gap-2"> -->
  <div class="card contain m-5 flex flex-col gap-5">
    <h1 class="font-extrabold text-2xl">
      Favorite books
    </h1>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-6">
      <div
        v-for="i in 12"
        :key="i"
        class="flex flex-col gap-4"
      >
        <div class="skeleton h-100 w-full" />
        <div class="skeleton h-8 w-full" />
        <div class="skeleton h-8 w-28" />
      </div>
    </div>

    <!-- Result -->
    <div v-else-if="books[0]?.title">
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-6">
        <div v-for="book in paginatedBooks" :key="book.id">
          <button @click="openBook(book.id)">
            <div class="min-h-100">
              <img :src="book?.coverUrl ?? DEFAULT_BOOK_COVER" alt="" srcset="" class="h-100 w-full">
            </div>
            <div class="line-clamp-1">
              {{ book.title }}
            </div>
            <div v-for="(author, index) in book.author" :key="index">
              {{ typeof author === 'string' ? author : author.name }}<span v-if="index < book.author.length - 1"> , </span>
            </div>
          </button>
        </div>
      </div>
      <!-- Pagination -->
      <div class="contain flex justify-center pt-10">
        <div class="join">
          <button
            class="join-item btn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            «
          </button>
          <button class="join-item btn">
            {{ currentPage }} / {{ totalPages }}
          </button>
          <button
            class="join-item btn"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            »
          </button>
        </div>
      </div>
    </div>

    <!-- Empty Result -->
    <div v-else>
      <div class="card bg-base-300 text-neutral-content contain">
        <div class="card-body items-center text-center contain">
          <h2 class="card-title">
            <Icon name="tabler:search" size="100" />
          </h2>
          <p class="text-5xl">
            No Result
          </p>
          <p class="text-xl">
            We cannot find the book you are searching for.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
