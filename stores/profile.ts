import type { Profile } from "#imports";
import type { UpdateProfileDTO } from "~/shared/dto";

export const useProfileStore = defineStore("profile", () => {
  const profileDetails = ref<Profile>();
  const loading = ref(false);
  const updateLoading = ref(false);

  const fetchProfile = async (userId: string) => {
    loading.value = true;
    try {
      const profile = await $fetch(`/api/profile/user/${userId}`, { method: "GET" });
      profileDetails.value = profile;
      return profile;
    }
    catch (e) {
      console.error("Failed to fetch profile at store: ", e);
      return profileDetails.value;
    }
    finally {
      loading.value = false;
    }
  };

  const updateProfile = async (profileId: string, updatedProfile: Partial<UpdateProfileDTO>) => {
    updateLoading.value = true;
    try {
      const profile = await $fetch(`/api/profile/user/${profileId}`, { method: "PATCH", body: updatedProfile });

      if (!profile)
        return profileDetails.value;

      profileDetails.value = profile;
      return profile;
    }
    catch (e) {
      console.error("Failed to update profile at store: ", e);
      return profileDetails.value;
    }
  };

  return {
    profileDetails,
    loading,
    fetchProfile,
    updateProfile,
  };
});
