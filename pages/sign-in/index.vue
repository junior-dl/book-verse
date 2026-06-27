<script setup lang="ts">
const authStore = useAuthStore();
</script>

<template>
  <div v-if="!authStore.user" class="w-full flex justify-center container mt-20">
    <button :disabled="authStore.loading " class="btn btn-primary" type="button" @click="authStore.signInWithGoogle">
      Continue with Google
      <span v-if="authStore.loading" class="loading loading-spinner loading-md" />
      <Icon v-else name="tabler:brand-google-filled" size="20" />
    </button>
  </div>

  <div v-else>
    You are logged in!
  </div>
</template>
