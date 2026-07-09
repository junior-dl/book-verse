<script setup lang="ts">
import type { Book } from "#imports";

const props = defineProps<{
  subjects: string[];
  books: Record<string, Book[]>;
  defaultCover: string;
}>();
</script>

<template>
  <div class="mx-4">
    <div
      v-for="subject in props.subjects"
      :key="subject"
      class="mb-8"
    >
      <h2 class="text-4xl font-bold my-5">
        {{ subject }}
      </h2>

      <!-- Books Under the subject -->
      <div class="flex md:flex-row flex-col gap-4 flex-wrap">
        <div v-for="book in props.books[subject]" :key="book.id" class="flex-1">
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
                <button class="btn btn-primary w-full">
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
