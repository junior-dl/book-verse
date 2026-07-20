<script lang="ts" setup>
// Stores
const profileStore = useProfileStore();
const authStore = useAuthStore();

const profile = computed(() => profileStore.profileDetails);
const user = computed(() => authStore.user);

watch(
  () => authStore.user?.id,
  async (id) => {
    if (!id)
      return;
    await profileStore.fetchProfile(id);
  },
  { immediate: true },

);
</script>

<template>
  <div class="max-w-500 mx-auto">
    <ProfileCardDetailsProfileHeaderSection :name="user?.name" :avatar="profile?.avatarUrl" :email="user?.email" :username="profile?.username" :about="profile?.about" :joined-date="profile?.createdAt" :profile="profile" />

    <ProfileCardDetailsFavoriteBooksSection />

    <ProfileCardDetailsShelfSection />
  </div>
</template>
