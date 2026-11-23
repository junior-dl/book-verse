<script lang="ts" setup>
import type { Book } from "~/shared/types";

const props = defineProps<{ book: Book }>();

const ID_LABELS: Record<string, string> = {
  gutenberg: "Project Gutenberg",
  openlibrary: "Open Library",
  google: "Google Books",
  isbn13: "ISBN-13",
  isbn10: "ISBN-10",
  doi: "DOI",
  prh: "Penguin Random House",
};

const sources = computed(() => [...new Set(props.book.formats.map(f => f.source))]);
</script>

<template>
  <div class="card bg-base-300 m-3 overflow-x-auto p-3 shadow-sm sm:m-5 sm:p-5">
    <table class="table table-sm sm:table-md">
      <tbody>
        <tr>
          <td class="w-28 font-semibold sm:w-48">
            Authors
          </td>
          <td>{{ props.book.authors.map(a => a.name).join(", ") || "Unknown" }}</td>
        </tr>
        <tr>
          <td class="font-semibold">
            Languages
          </td>
          <td>{{ props.book.languages.join(", ").toUpperCase() || "—" }}</td>
        </tr>
        <tr v-if="sources.length">
          <td class="font-semibold">
            Downloads from
          </td>
          <td>{{ sources.join(", ") }}</td>
        </tr>
        <tr v-for="id in props.book.identifiers" :key="`${id.kind}-${id.value}`">
          <td class="font-semibold">
            {{ ID_LABELS[id.kind] ?? id.kind }}
          </td>
          <td class="break-all">
            {{ id.value }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
