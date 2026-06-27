<script setup lang="ts">
const authStore = useAuthStore();
const displayName = computed(() => authStore.user ? authStore.user.name.split(" ", 1)[0] : "");
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
      <input type="text" placeholder="Search" class="input input-bordered w-24 md:w-auto">

      <!-- Button -->

      <div class="navbar-end">
        <AppThemeToggle />

        <div v-if="!authStore.loading && authStore.user" class="dropdown dropdown-end">
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
          <ul tabindex="-1" class="dropdown-content menu bg-base-200 rounded-box z-1 w-52 p-2 shadow-sm">
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

      <!-- Profile -->
      <!-- <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
          <div class="w-10 rounded-full">
            <img
              alt="Tailwind CSS Navbar component"
              src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
            >
          </div>
        </div>
        <ul
          tabindex="-1"
          class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
        >
          <li>
            <a class="justify-between">
              Profile
              <span class="badge">New</span>
            </a>
          </li>
          <li><a>Settings</a></li>
          <li><a>Logout</a></li>
        </ul>
      </div> -->
    </div>
  </div>
</template>
