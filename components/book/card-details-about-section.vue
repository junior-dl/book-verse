<script setup lang="ts">
const props = defineProps<{
  summary?: string[];
}>();
</script>

<template>
  <div class="card bg-base-300 contain m-5 p-5 shadow-sm flex flex-row">
    <div v-if="props.summary">
      <div v-for="(sum, index) in props.summary" :key="index">
        {{ sum }}
      </div>
    </div>
  </div>
</template>
