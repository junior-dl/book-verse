import { createAuthClient } from "better-auth/vue";

const authClient = createAuthClient();

export const useAuthStore = defineStore("useAuthStore", () => {
  const session = authClient.useSession();
  const user = computed(() => session.value.data?.user);
  const force_load = ref(false);
  const loading = computed(() => session.value.isPending || session.value.isRefetching || force_load.value);

  async function signInWithGoogle() {
    force_load.value = true;
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
        errorCallbackURL: "/error",
      });
    }
    finally {
      force_load.value = false;
    }
  }

  async function signOut() {
    await authClient.signOut();
    navigateTo("/");
  }

  return {
    loading,
    user,
    signInWithGoogle,
    signOut,
  };
});
