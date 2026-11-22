<script lang="ts" setup>
import type { SubjectRef } from "~/shared/types";

const props = defineProps<{ subjects: SubjectRef[] }>();
</script>

<template>
  <div v-if="props.subjects.length" class="card bg-base-300 m-5 flex flex-row flex-wrap gap-2 p-5 shadow-sm">
    <NuxtLink v-for="s in props.subjects" :key="s.slug" :to="`/subject/${s.slug}`" class="btn btn-soft btn-sm border-primary-content">
      {{ s.name }}
    </NuxtLink>
  </div>
</template>
