<script lang="ts" setup>
import type { Profile } from "#imports";

const props = defineProps<{
  profile?: Profile;
}>();

const name = ref("");
const username = ref("");
const email = ref("");
const bio = ref("");
const avatarUrl = ref("");

const profileId = computed(() => props.profile?.id);
const profileStore = useProfileStore();

async function handleEdit() {
  const id: string = profileId.value ?? "";
  const previous = props.profile;
  const data
    = { ...previous, name: name.value ?? "", username: username.value ?? "", email: email.value ?? "", about: bio.value ?? "", avatarUrl: avatarUrl.value ?? "" };

  console.warn("updated profile: ", data);
  await profileStore.updateProfile(id, data);
}

watch(
  () => props.profile,
  (profile) => {
    if (!profile)
      return;

    name.value = profile.name ?? "";
    username.value = profile.username ?? "";
    email.value = profile.email ?? "";
    bio.value = profile.about ?? "";
    avatarUrl.value = profile.avatarUrl ?? "";
  },
  { immediate: true },
);
</script>

<template>
  <dialog id="edit_profile_modal" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box">
      <h3 class="text-lg font-bold">
        Edit Profile
      </h3>
      <div class="py-4">
        <!-- Name -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            Name
          </legend>
          <input v-model="name" type="text" class="input w-full" placeholder="Type here">
        </fieldset>

        <!-- Username -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            Username
          </legend>
          <input v-model="username" type="text" class="input w-full" placeholder="Type here">
        </fieldset>

        <!-- Email -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            Email
          </legend>
          <input v-model="email" type="text" class="input w-full" placeholder="Type here">
        </fieldset>

        <!-- Bio -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            Bio
          </legend>
          <textarea v-model="bio" class="textarea w-full" placeholder="Bio" />
        </fieldset>
      </div>
      <div class="modal-action">
        <form method="dialog" class="flex flex-row gap-2">
          <!-- if there is a button in form, it will close the modal -->
          <button class="btn">
            Cancel
          </button>

          <button class="btn btn-primary" @click="handleEdit()">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  </dialog>
</template>
