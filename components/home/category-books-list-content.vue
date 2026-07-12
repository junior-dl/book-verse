<script setup lang="ts">
import type { Book } from "~/shared/types";

const props = defineProps<{
  subjects: string[];
  books: Record<string, Book[]>;
  loading?: boolean;
  defaultCover: string;
}>();
const BookStore = useBookStore();
const MAX_DISPLAYED_BOOKS = BookStore.HOMEPAGE_MAX_BOOKS;

const router = useRouter();

function openBook(bookId?: string) {
  if (!bookId)
    return;
  router.push(`/book/${bookId}`);
}
</script>

<template>
  <div class="mx-4">
    <div v-if="loading">
      <div
        v-for="subj in props.subjects"
        :key="subj"
        class="mb-8"
      >
        <!-- Subject Name -->
        <h2 class="text-4xl font-bold my-5">
          {{ subj }}
        </h2>
        <!-- Loading -->
        <div class="grid grid-cols-1 gap-8 sm:grid-cols-1 lg:grid-cols-6">
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
      </div>
    </div>

    <div
      v-for="subject in props.subjects"
      v-else
      :key="subject"
      class="mb-8"
    >
      <!-- Subject Name -->
      <h2 class="text-4xl font-bold my-5">
        {{ subject }}
      </h2>

      <div class="grid grid-cols-1 gap-8 sm:grid-cols-1 lg:grid-cols-6">
        <div v-for="book in props.books[subject]?.slice(0, MAX_DISPLAYED_BOOKS)" :key="book.id" class="flex-1">
          <div class="card bg-base-100 w-auto shadow-sm">
            <!-- Image -->
            <figure class="h-80 overflow-hidden">
              <img
                :src="book.coverUrl ?? defaultCover"
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
