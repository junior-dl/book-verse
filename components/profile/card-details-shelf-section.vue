<script setup lang="ts">
const store = useShelvesStore();
const modal = ref<{ open: () => void } | null>(null);
const preview = computed(() => store.shelves.slice(0, 4));

onMounted(() => store.fetchMine());
</script>

<template>
  <div class="m-5 flex flex-col gap-5">
    <div class="flex flex-row items-center justify-between gap-2">
      <h1 class="text-2xl font-extrabold">
        Your shelves
      </h1>
      <div class="flex items-center gap-2">
        <NuxtLink v-if="store.shelves.length > 4" to="/profile/shelves" class="link link-hover">
          View all
        </NuxtLink>
        <button class="btn btn-sm btn-primary" @click="modal?.open()">
          <Icon name="tabler:plus" size="16" /> New shelf
        </button>
      </div>
    </div>

    <div v-if="store.loading && !store.shelves.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="skeleton h-48" />
    </div>
    <div v-else-if="preview.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ShelfCard v-for="s in preview" :key="s.id" :shelf="s" />
    </div>
    <p v-else class="italic opacity-70">
      No shelves yet. Make one, then use “Add to shelf” on any book.
    </p>

    <ShelfFormModal ref="modal" @saved="(id) => navigateTo(`/shelf/${id}`)" />
  </div>
</template>
