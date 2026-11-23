<script setup lang="ts">
const authStore = useAuthStore();

const name = ref("");
const email = ref("");
const password = ref("");

async function submit() {
  await authStore.signUpWithEmail(name.value, email.value, password.value);
  await navigateTo("/");
};
</script>

<template>
  <div v-if="!authStore.user" class="w-full flex justify-center px-2 mt-8 sm:mt-20">
    <div class="card bg-base-300 w-full max-w-md m-4 p-5 sm:m-5 shadow-sm flex flex-col gap-5">
      <div class="w-full flex flex-col items-center">
        <h1 class="font-extrabold text-2xl">
          Welcome back
        </h1>
        <div class="whitespace-nowrap">
          Signup with your Google account
        </div>
      </div>
      <!-- Login with Google Button -->
      <button :disabled="authStore.loading " class="btn bg-white text-black border-[#e5e5e5]" type="button" @click="authStore.signInWithGoogle">
        <span v-if="authStore.loading" class="loading loading-spinner loading-md" />
        <Icon v-else name="devicon:google" size="20" />
        Signup with Google
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
        <label class="fieldset">
          <span class="label">Name</span>
          <input
            v-model="name" type="text" class="input validator w-full" required placeholder="e.g., Name"
            pattern="[A-Za-z][A-Za-z0-9\-]*" minlength="3" maxlength="30" title="Only letters, numbers or dash"
          >
          <p class="validator-hint hidden">
            Must be 3 to 30 characters
            <br>containing only letters, numbers or dash
          </p>
        </label>

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
      <button class="btn btn-primary mt-4" type="submit" @click="submit">
        Signup
      </button>

      <!-- Signup -->
      <div class="flex flex-row items-center justify-center">
        <span>Already have an account?</span>
        <button class="btn btn-link text-base-content px-2">
          Login
        </button>
      </div>
    </div>
  </div>

  <div v-else>
    You are logged in!
  </div>
</template>
