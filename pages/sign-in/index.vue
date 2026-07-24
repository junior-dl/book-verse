<script setup lang="ts">
const authStore = useAuthStore();

const email = ref("");
const password = ref("");

async function submit() {
  await authStore.signInWithEmail(email.value, password.value);
  await navigateTo("/profile");
}
</script>

<template>
  <div v-if="!authStore.user" class="w-full flex justify-center container mt-20">
    <div class="card bg-base-300 w-1/4 m-5 p-5 shadow-sm flex flex-col gap-5">
      <div class="w-full flex flex-col items-center">
        <h1 class="font-extrabold text-2xl">
          Welcome back
        </h1>
        <div class="whitespace-nowrap">
          Login with your Google account
        </div>
      </div>
      <!-- Login with Google Button -->
      <button :disabled="authStore.loading " class="btn bg-white text-black border-[#e5e5e5]" type="button" @click="authStore.signInWithGoogle">
        <span v-if="authStore.loading" class="loading loading-spinner loading-md" />
        <Icon v-else name="devicon:google" size="20" />
        Login with Google
      </button>

      <!-- Alternative -->
      <div class="flex flex-row gap-2 items-center">
        <div class="border w-full h-0.2" />
        <div class="whitespace-nowrap">
          Or continue with
        </div>
        <div class="border w-full h-0.2" />
      </div>

      <!-- Login Fields -->
      <div class="flex flex-col gap-3">
        <fieldset class="fieldset">
          <label class="label">Email</label>
          <input v-model="email" type="email" class="input validator w-full" placeholder="e.g., mail@example.com" required>
          <p class="validator-hint hidden">
            Required
          </p>
        </fieldset>

        <label class="fieldset">
          <div class="flex justify-between">
            <span class="label">Password</span>
            <NuxtLink>Forget your password?</NuxtLink>
          </div>
          <input v-model="password" type="password" class="input validator w-full" placeholder="e.g., password123" required>
          <span class="validator-hint hidden">Required</span>
        </label>
      </div>

      <!-- Login Button -->
      <button class="btn btn-neutral mt-4" type="submit" @click="submit">
        Login
      </button>

      <!-- Signup -->
      <div class="flex flex-row items-center justify-center">
        <span>Don't have an account?</span>
        <NuxtLink class="btn btn-link text-base-content px-2" to="/sign-up">
          Sign-up
        </NuxtLink>
      </div>
    </div>
  </div>

  <div v-else>
    <section class="hero min-h-screen bg-base-100">
      <div class="hero-content text-center">
        <div class="max-w-xl">
          <div class="badge badge-soft badge-success badge-lg mb-4">
            ✓ Signed In
          </div>

          <h1 class="text-5xl font-bold">
            Welcome back!
          </h1>

          <p class="py-6 text-lg opacity-80">
            You're signed in and ready to continue your reading journey.
            Discover new books, manage your shelves, or see what the community is reading.
          </p>

          <div class="flex justify-center gap-4">
            <NuxtLink
              to="/"
              class="btn btn-primary"
            >
              Explore Books
            </NuxtLink>

            <NuxtLink
              to="/profile"
              class="btn btn-outline"
            >
              View Profile
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
