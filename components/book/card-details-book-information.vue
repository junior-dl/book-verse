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
  <div class="card bg-base-300 m-5 p-5 shadow-sm">
    <table class="table">
      <tbody>
        <tr>
          <td class="w-48 font-semibold">
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
          <td>{{ id.value }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
