<script setup lang="ts">
const props = defineProps<{ page: number; total: number; pageSize: number }>();
const emit = defineEmits<{ change: [page: number] }>();
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));
</script>

<template>
  <div v-if="pages > 1" class="flex justify-center pt-10">
    <div class="join">
      <button class="join-item btn" :disabled="props.page <= 1" @click="emit('change', props.page - 1)">
        «
      </button>
      <button class="join-item btn pointer-events-none">
        {{ props.page }} / {{ pages }}
      </button>
      <button class="join-item btn" :disabled="props.page >= pages" @click="emit('change', props.page + 1)">
        »
      </button>
    </div>
  </div>
</template>
