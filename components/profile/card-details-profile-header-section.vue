<script lang="ts" setup>
import type { Profile } from "#imports";

import { timestampToDateFormat } from "#imports";

const props = defineProps<{
  profile?: Profile;
}>();

function getDefaultAvatar() {
  const name = computed(() => props.profile?.name) ?? "";
  return `https://ui-avatars.com/api/?name=${name}`;
}
</script>

<template>
  <div class="card bg-base-200 contain m-5 p-5 shadow-sm flex flex-col gap-2">
    <!-- Edit Button -->
    <button class="btn btn-primary btn-sm order-last self-center sm:absolute sm:top-5 sm:right-5 sm:order-none sm:btn-md" onclick="edit_profile_modal.showModal()">
      <Icon name="tabler:pencil" size="18" /> Edit Profile
    </button>

    <!-- Profile Details -->
    <div class="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:pr-36 sm:text-left">
      <!-- Avatar -->
      <div class="avatar">
        <div class="w-24 rounded-full sm:w-30">
          <img :src="props.profile?.avatarUrl ?? getDefaultAvatar()">
        </div>
      </div>
      <div class="flex min-w-0 flex-col gap-2">
        <!-- Name -->
        <h1 class="break-words text-3xl font-extrabold sm:text-4xl">
          {{ props.profile?.name }}
        </h1>

        <!-- Username and Email -->
        <div>
          <div class="flex items-end gap-1 text-secondary-content">
            <Icon name="tabler:at" size="18" /> {{ props.profile?.username }}
          </div>
          <div class="flex items-end gap-1 text-secondary-content">
            <Icon name="tabler:mail" size="18" /> {{ props.profile?.email }}
          </div>
        </div>

        <!-- Bio -->
        <div>
          {{ props.profile?.about }}
        </div>
      </div>
    </div>

    <div class="border border-gray-300 mt-10 mb-2" />

    <div class="flex items-end gap-1">
      Joined {{ timestampToDateFormat(props.profile?.createdAt) }}
    </div>
  </div>

  <ModalEditProfile :profile="props.profile" />
</template>
