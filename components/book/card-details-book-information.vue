<script lang="ts" setup>
import type { Author } from "~/shared/types";

const props = defineProps<{
  authors?: (string | Author)[];
  language?: string[];
  source?: string;
  sourceDownloadCount: number;
  downloadCount: number;
}>();
</script>

<template>
  <div class="card bg-base-300 contain m-5 p-5 shadow-sm flex flex-row gap-2">
    <div class="overflow-x-auto">
      <table class="table">
        <!-- head -->
        <thead>
          <tr>
            <th>Information</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <!-- row 1 -->
          <tr>
            <td>Author</td>
            <td>
              <div v-if="props.authors">
                <div v-for="(author, index) in props?.authors" :key="index">
                  {{ typeof author === 'string' ? author : author.name }}<span v-if="index < props.authors.length - 1"> , </span>
                </div>
              </div>
            </td>
          </tr>
          <!-- row 2 -->
          <tr>
            <td>Language</td>
            <td>
              <div v-if="props.language">
                <div v-for="(lang, index) in props.language" :key="index">
                  {{ lang }}<span v-if="index < props.language.length - 1"> , </span>
                </div>
              </div>
            </td>
          </tr>
          <!-- row 3 -->
          <tr>
            <td>Source</td>
            <td>{{ props.source }}</td>
          </tr>
          <!-- row 4 -->
          <tr>
            <td>Downloads</td>
            <td>{{ props.sourceDownloadCount + props.downloadCount }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
