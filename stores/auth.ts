import { createAuthClient } from "better-auth/vue";

const authClient = createAuthClient();

export const useAuthStore = defineStore("useAuthStore", () => {
  const session = authClient.useSession();
  const initialized = computed(() => !session.value.isPending);
  const loading = ref(false);
  const user = computed(() => session.value.data?.user ?? null);

  async function refreshSession() {
    await session.value.refetch();
  }

  async function signUpWithEmail(
    name: string,
    email: string,
    password: string,
  ) {
    loading.value = true;
    try {
      await authClient.signUp.email({
        name,
        email,
        password,
      });
      await refreshSession();
      await navigateTo("/");
    }
    finally {
      loading.value = false;
    }
  }

  async function signInWithEmail(
    email: string,
    password: string,
  ) {
    loading.value = true;
    try {
      await authClient.signIn.email({
        email,
        password,
        rememberMe: true, // optional
      });
      await refreshSession();
      await navigateTo("/");
    }
    finally {
      loading.value = false;
    }
  }

  async function signInWithGoogle() {
    loading.value = true;
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        errorCallbackURL: "/error",
      });
    }
    finally {
      loading.value = false;
    }
  }

  async function signOut() {
    loading.value = true;
    try {
      await authClient.signOut();
      await refreshSession();
      await navigateTo("/");
    }
    finally {
      loading.value = false;
    }
  }

  return {
    initialized,
    loading,
    user,
    refreshSession,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
  };
});
