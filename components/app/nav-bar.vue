<script setup lang="ts">
const authStore = useAuthStore();

const displayName = computed(() => authStore.user ? authStore.user.name.split(" ", 1)[0] : "");

const q = ref("");

const router = useRouter();

function search() {
  router.push(`/search/${q.value}`);
}
</script>

<template>
  <div class="navbar bg-base-300 shadow-sm">
    <div class="flex-1">
      <NuxtLink to="/" class="btn btn-ghost text-xl">
        BookVerse
      </NuxtLink>
    </div>
    <div class="flex gap-2 items-center">
      <!-- Search Bar -->
      <input v-model="q" type="text" placeholder="Search" class="input input-bordered w-24 md:w-auto" @keyup.enter="search">

      <!-- Button -->

      <div class="navbar-end">
        <AppThemeToggle />

        <div v-if="!authStore.initialized">
          <div class="skeleton h-10 w-24 rounded-lg" />
        </div>

        <div v-else-if="authStore.user" class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-primary m-1">
            <!-- Profile Picture -->
            <div v-if="authStore.user.image" class="avatar">
              <div class="w-8 rounded-full">
                <img :src="authStore.user.image">
              </div>
            </div>

            <!-- User Name -->
            <div>{{ displayName }}</div>
          </div>
          <ul tabindex="-1" class="dropdown-content menu bg-base-200 rounded-box z-5 w-52 p-2 shadow-sm">
            <li>
              <NuxtLink to="/profile">
                <Icon name="tabler:user-circle" size="20" /> Profile
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/sign-out">
                <Icon name="tabler:logout" size="20" /> Sign Out
              </NuxtLink>
            </li>
          </ul>
        </div>

        <NuxtLink v-else to="/sign-in" class="btn btn-primary">
          Sign In <Icon name="fa7-solid:arrow-right-to-bracket" size="20" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
