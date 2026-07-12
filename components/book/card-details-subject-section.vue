<script lang="ts" setup>
const props = defineProps<{
  subjects?: string[];
}>();
</script>

<template>
  <div class="card bg-base-300 contain m-5 p-5 shadow-sm flex flex-row gap-2">
    <div v-for="(sub, i) in props.subjects" :key="i">
      <button class="btn btn-soft border-primary-content">
        {{ sub }}
      </button>
    </div>
  </div>
</template>
