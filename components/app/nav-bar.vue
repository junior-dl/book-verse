<script setup lang="ts">
const authStore = useAuthStore();

const displayName = computed(() => authStore.user ? authStore.user.name.split(" ", 1)[0] : "");
const initial = computed(() => (authStore.user?.name ?? "?").trim().charAt(0).toUpperCase());

const q = ref("");

const router = useRouter();

function search() {
  if (q.value.trim())
    router.push(`/search/${encodeURIComponent(q.value.trim())}`);
}

// Admin link: only fetched once someone is signed in; the endpoint never throws.
const { data: admin, refresh: refreshAdmin } = useFetch<{ isAdmin: boolean; openFlags: number }>("/api/admin/me", {
  server: false,
  immediate: false,
  default: () => ({ isAdmin: false, openFlags: 0 }),
});

watch(() => authStore.user?.id, (id) => {
  if (id)
    refreshAdmin();
  else
    admin.value = { isAdmin: false, openFlags: 0 };
}, { immediate: true });
</script>

<template>
  <div class="navbar sticky top-0 z-30 gap-2 bg-base-300 px-2 shadow-sm sm:px-4">
    <div class="flex-none">
      <NuxtLink to="/" class="btn btn-ghost h-auto gap-2 px-1 py-1 text-xl sm:px-3" aria-label="BookVerse home">
        <AppLogoMark :size="36" />
        <span class="hidden tracking-wider sm:inline" style="font-family: var(--title-font)">Book<span class="text-[#BFA15A]">Verse</span></span>
      </NuxtLink>
    </div>

    <!-- Search: fills the space on phones -->
    <form class="min-w-0 flex-1 sm:flex-none" role="search" @submit.prevent="search">
      <label class="input input-bordered flex w-full items-center gap-2 sm:w-64">
        <Icon name="tabler:search" size="18" class="shrink-0 opacity-60" aria-hidden="true" />
        <input v-model="q" type="search" placeholder="Search books or authors" aria-label="Search books or authors" class="min-w-0 grow">
      </label>
    </form>

    <div class="ml-auto flex flex-none items-center gap-1">
      <AppThemeToggle />

      <div v-if="!authStore.initialized">
        <div class="skeleton h-10 w-10 rounded-full sm:w-24 sm:rounded-lg" />
      </div>

      <div v-else-if="authStore.user" class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-primary indicator px-2 sm:px-4" :aria-label="`Account menu for ${displayName}`">
          <span v-if="admin.isAdmin && admin.openFlags > 0" class="badge indicator-item badge-error badge-xs" aria-hidden="true" />
          <div class="avatar">
            <div class="w-8 rounded-full">
              <img v-if="authStore.user.image" :src="authStore.user.image" alt="">
              <span v-else class="flex h-full w-full items-center justify-center bg-base-100 font-bold text-base-content">{{ initial }}</span>
            </div>
          </div>
          <span class="hidden sm:inline">{{ displayName }}</span>
        </div>
        <ul tabindex="-1" class="dropdown-content menu z-40 mt-2 w-56 rounded-box bg-base-200 p-2 shadow-sm">
          <li>
            <NuxtLink to="/profile">
              <Icon name="tabler:user-circle" size="20" /> Profile
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/profile/favorite">
              <Icon name="tabler:heart" size="20" /> Favorites
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/profile/shelves">
              <Icon name="tabler:books" size="20" /> Shelves
            </NuxtLink>
          </li>
          <li v-if="admin.isAdmin">
            <NuxtLink to="/admin/flags" class="justify-between">
              <span class="flex items-center gap-2"><Icon name="tabler:flag" size="20" /> Review flags</span>
              <span v-if="admin.openFlags > 0" class="badge badge-error badge-sm">{{ admin.openFlags }}</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/sign-out">
              <Icon name="tabler:logout" size="20" /> Sign Out
            </NuxtLink>
          </li>
        </ul>
      </div>

      <NuxtLink v-else to="/sign-in" class="btn btn-primary px-3 sm:px-4" aria-label="Sign in">
        <span class="hidden sm:inline">Sign In</span> <Icon name="fa7-solid:arrow-right-to-bracket" size="20" />
      </NuxtLink>
    </div>
  </div>
</template>
