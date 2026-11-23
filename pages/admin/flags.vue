<script lang="ts" setup>
import type { DataFlag, FlagAction } from "~/shared/types";

const { data: flags, error, refresh, status } = await useFetch<DataFlag[]>("/api/admin/flags");
const busy = ref<number | null>(null);
const scanning = ref(false);
const message = ref("");

const LABELS: Record<DataFlag["kind"], { title: string; hint: string }> = {
  many_authors: { title: "3+ authors", hint: "Often a compilation merged in. Remove the authors who don't belong, or dismiss if it's a real anthology." },
  author_after_pub: { title: "Author born after publication", hint: "That author almost certainly doesn't belong on this book." },
  possible_duplicate: { title: "Possible duplicate", hint: "Same author, near-identical titles, still two books." },
};

async function resolve(flag: DataFlag, action: FlagAction, authorId?: string) {
  busy.value = flag.id;
  try {
    await $fetch(`/api/admin/flags/${flag.id}`, { method: "PATCH", body: { action, authorId } });
    await refresh();
  }
  finally {
    busy.value = null;
  }
}

async function scan() {
  scanning.value = true;
  try {
    const r = await $fetch<{ new_flags: number; auto_fixed: number; open_flags: number }>("/api/admin/flags/scan", { method: "POST" });
    message.value = `Scan done: ${r.new_flags} new, ${r.auto_fixed} closed themselves, ${r.open_flags} open.`;
    await refresh();
  }
  finally {
    scanning.value = false;
  }
}

useHead({ title: "Data health · BookVerse" });
</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-5 p-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">
          Data health
        </h1>
        <p class="opacity-70">
          Suspicious catalog data found by the weekly scan. Nothing changes until you choose an action.
        </p>
      </div>
      <button class="btn btn-outline" :disabled="scanning" @click="scan">
        <span v-if="scanning" class="loading loading-spinner loading-sm" />
        Scan now
      </button>
    </div>
    <p v-if="message" class="text-sm opacity-80">
      {{ message }}
    </p>

    <div v-if="error" class="alert alert-error">
      {{ error.statusCode === 403 ? "This page is for admins only. Add your email to ADMIN_EMAILS." : "Could not load flags." }}
    </div>

    <div v-else-if="status === 'pending'" class="skeleton h-32 w-full" />

    <BookEmptyState v-else-if="!flags?.length" title="All clear" message="No open flags. The scan runs every Monday." />

    <ul v-else class="flex flex-col gap-3">
      <li v-for="flag in flags" :key="flag.id" class="card bg-base-200 p-4 shadow-sm">
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge badge-warning">{{ LABELS[flag.kind].title }}</span>
            <NuxtLink :to="`/book/${flag.work.slug}`" class="link font-semibold">
              {{ flag.work.title }}
            </NuxtLink>
            <template v-if="flag.otherWork">
              <span class="opacity-60">and</span>
              <NuxtLink :to="`/book/${flag.otherWork.slug}`" class="link font-semibold">
                {{ flag.otherWork.title }}
              </NuxtLink>
            </template>
          </div>
          <p>{{ flag.detail }}</p>
          <p class="text-sm opacity-60">
            {{ LABELS[flag.kind].hint }}
          </p>
          <!-- 3+ authors: pick who doesn't belong -->
          <ul v-if="flag.kind === 'many_authors'" class="flex flex-col gap-1 pt-1">
            <li v-for="a in flag.workAuthors" :key="a.id" class="flex items-center justify-between gap-3 rounded-box bg-base-100 px-3 py-1.5">
              <NuxtLink :to="`/author/${a.slug}`" class="link link-hover truncate">
                {{ a.name }}
              </NuxtLink>
              <button class="btn btn-xs btn-error btn-outline shrink-0" :disabled="busy === flag.id" @click="resolve(flag, 'remove_author', a.id)">
                Remove
              </button>
            </li>
          </ul>

          <div class="flex flex-wrap gap-2 pt-1">
            <button v-if="flag.author" class="btn btn-sm btn-error" :disabled="busy === flag.id" @click="resolve(flag, 'remove_author')">
              Remove {{ flag.author.name }} from this book
            </button>
            <button v-if="flag.otherWork" class="btn btn-sm btn-primary" :disabled="busy === flag.id" @click="resolve(flag, 'merge')">
              Merge into one book
            </button>
            <button class="btn btn-sm btn-ghost" :disabled="busy === flag.id" @click="resolve(flag, 'dismiss')">
              Looks fine, dismiss
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
