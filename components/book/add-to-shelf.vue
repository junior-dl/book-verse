<script setup lang="ts">
import type { ShelfForBook } from "~/shared/types";

const props = defineProps<{ workId: string }>();

const authStore = useAuthStore();
const store = useShelvesStore();
const shelves = ref<ShelfForBook[]>([]);
const state = ref<"idle" | "loading" | "ready" | "error">("idle");
const busy = ref<string | null>(null);
const modal = ref<{ open: () => void } | null>(null);

async function load() {
  if (!authStore.user)
    return;
  state.value = "loading";
  try {
    shelves.value = await store.forBook(props.workId);
    state.value = "ready";
  }
  catch (e) {
    console.error("Could not load shelves:", e);
    state.value = "error";
  }
}

// Load in the background as soon as we know who's signed in, so the menu opens instantly.
watch(() => [authStore.user?.id, props.workId], ([id]) => {
  if (id)
    load();
}, { immediate: true });

function onOpen() {
  if (!authStore.user)
    return navigateTo("/sign-in");
  if (state.value === "idle" || state.value === "error")
    load();
}

async function toggle(s: ShelfForBook) {
  busy.value = s.id;
  try {
    if (s.hasBook)
      await store.removeBook(s.id, props.workId);
    else
      await store.addBook(s.id, props.workId);
    s.hasBook = !s.hasBook;
  }
  catch (e) {
    console.error("Could not update shelf:", e);
  }
  finally {
    busy.value = null;
  }
}

async function created(id: string) {
  await store.addBook(id, props.workId);
  await load();
}

const onShelves = computed(() => shelves.value.filter(s => s.hasBook).length);
</script>

<template>
  <div class="dropdown dropdown-bottom sm:dropdown-end">
    <div tabindex="0" role="button" class="btn" @click="onOpen" @keyup.enter="onOpen">
      <Icon name="tabler:books" size="20" />
      {{ onShelves ? `On ${onShelves} shelf${onShelves > 1 ? "s" : ""}` : "Add to shelf" }}
    </div>
    <div v-if="authStore.user" tabindex="-1" class="dropdown-content z-20 mt-2 w-64 rounded-box bg-base-100 p-2 shadow-md">
      <div v-if="state === 'loading' || state === 'idle'" class="flex items-center gap-2 p-3 text-sm opacity-70">
        <span class="loading loading-spinner loading-sm" /> Loading your shelves…
      </div>
      <div v-else-if="state === 'error'" class="flex flex-col gap-2 p-2 text-sm">
        <span class="text-error">Couldn't load your shelves.</span>
        <button class="btn btn-sm" @click="load">
          Try again
        </button>
      </div>
      <template v-else>
        <p v-if="!shelves.length" class="p-2 text-sm opacity-70">
          You don't have any shelves yet.
        </p>
        <ul class="menu w-full p-0">
          <li v-for="s in shelves" :key="s.id">
            <label class="flex cursor-pointer items-center gap-3">
              <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" :checked="s.hasBook" :disabled="busy === s.id" @change="toggle(s)">
              <span class="truncate">{{ s.name }}</span>
            </label>
          </li>
        </ul>
        <button class="btn btn-ghost btn-sm mt-1 w-full justify-start" @click="modal?.open()">
          <Icon name="tabler:plus" size="16" /> New shelf with this book
        </button>
      </template>
    </div>
    <ShelfFormModal ref="modal" @saved="created" />
  </div>
</template>
