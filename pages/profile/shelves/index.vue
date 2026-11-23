<script setup lang="ts">
const store = useShelvesStore();
const modal = ref<{ open: () => void } | null>(null);

onMounted(() => store.fetchMine());
useHead({ title: "Shelves · BookVerse" });
</script>

<template>
  <div class="m-5 flex flex-col gap-5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-3xl font-extrabold">
        Your shelves
      </h1>
      <button class="btn btn-primary" @click="modal?.open()">
        <Icon name="tabler:plus" size="18" /> New shelf
      </button>
    </div>

    <div v-if="store.loading && !store.shelves.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="skeleton h-48" />
    </div>
    <div v-else-if="store.shelves.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ShelfCard v-for="s in store.shelves" :key="s.id" :shelf="s" />
    </div>
    <BookEmptyState v-else title="No shelves yet" message="Make a shelf, then use “Add to shelf” on any book page." />

    <ShelfFormModal ref="modal" @saved="(id) => navigateTo(`/shelf/${id}`)" />
  </div>
</template>
