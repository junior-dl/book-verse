<script setup lang="ts">
const props = defineProps<{ title?: string; message?: string }>();
</script>

<template>
  <div class="card bg-base-300">
    <div class="card-body items-center text-center">
      <Icon name="tabler:books" size="80" />
      <p class="text-3xl font-bold">
        {{ props.title ?? "No results" }}
      </p>
      <p class="opacity-80">
        {{ props.message ?? "We couldn't find any books here yet." }}
      </p>
    </div>
  </div>
</template>
