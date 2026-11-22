<script setup lang="ts">
const props = defineProps<{ description?: string | null }>();
</script>

<template>
  <div v-if="props.description" class="card bg-base-300 m-5 p-5 shadow-sm">
    <h2 class="mb-2 text-xl font-bold">
      About this book
    </h2>
    <p class="whitespace-pre-line leading-relaxed">
      {{ props.description }}
    </p>
  </div>
</template>
