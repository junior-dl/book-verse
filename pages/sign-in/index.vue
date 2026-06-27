<script setup lang="ts">
const authStore = useAuthStore();
</script>

<template>
  <div class="w-full flex justify-center container mt-20">
    <button :disabled="authStore.google_loading" class="btn btn-primary" type="button" @click="authStore.signInWithGoogle">
      Continue with Google
      <span v-if="authStore.google_loading" class="loading loading-spinner loading-md" />
      <Icon v-else name="tabler:brand-google-filled" size="20" />
    </button>
  </div>
</template>
