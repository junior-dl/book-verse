<script lang="ts" setup>
import type { Author, BookDownloadLinks } from "~/shared/types";

const props = defineProps<{
  id: string;
  coverUrl: string;
  title?: string;
  authors?: (string | Author)[];
  downloadLinks?: BookDownloadLinks;
}>();
</script>

<template>
  <div class="card bg-base-300 contain m-5 p-5 shadow-sm flex flex-row">
    <figure class="h-70 w-55 overflow-hidden bg-primary rounded-lg">
      <img
        :src="props?.coverUrl"
        :alt="props?.title"
        class="w-full h-full object-contain"
      >
    </figure>
    <div class="card-body w-full flex flex-col justify-between">
      <!-- Title -->
      <div class="flex flex-col gap-2">
        <h2 class="text-4xl font-extrabold">
          {{ props?.title || "No Title" }}
        </h2>
        <!-- Author -->
        <div v-if="props.authors" class="flex flex-row items-center">
          <span>by</span>
          <div v-for="(author, index) in props?.authors" :key="index">
            <button class="btn btn-link text-primary-content">
              {{ typeof author === 'string' ? author : author.name }}
            </button>
            <span v-if="index < props.authors.length - 1"> , </span>
          </div>
        </div>
      </div>

      <!-- Buttons -->
      <div class="card-actions justify-start">
        <a v-if="props.downloadLinks?.html" class="btn btn-primary" :href="props.downloadLinks?.html" target="_blank" rel="noopener noreferrer">
          Read Online
        </a>
        <a v-if="props.downloadLinks?.text" class="btn btn-primary" :href="props.downloadLinks?.text" target="_blank" rel="noopener noreferrer">
          Read as Plain Text
        </a>

        <div class="dropdown dropdown-hover">
          <div tabindex="0" role="button" class="btn btn-primary">
            Download
          </div>
          <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
            <li><a v-if="props.downloadLinks?.epub" :href="props.downloadLinks?.epub" target="_blank" rel="noopener noreferrer">Download EPUB</a></li>
            <li><a v-if="props.downloadLinks?.mobi" :href="props.downloadLinks?.mobi" target="_blank" rel="noopener noreferrer">Download MOBI</a></li>
          </ul>
        </div>
        <button class="btn btn-secondary">
          <Icon name="tabler:heart" size="24" />
          Save
        </button>
      </div>
    </div>
  </div>
</template>
