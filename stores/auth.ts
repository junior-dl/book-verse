import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient();

export const useAuthStore = defineStore("useAuthStore", () => {
  const google_loading = ref(false);

  async function signInWithGoogle() {
    google_loading.value = true;
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
      errorCallbackURL: "/error",
    });
    google_loading.value = false;
  }

  return {
    google_loading,
    signInWithGoogle,
  };
});
