import type { CreateShelfDTO, UpdateShelfDTO } from "~/shared/dto";
import type { ShelfForBook, ShelfSummary } from "~/shared/types";

export const useShelvesStore = defineStore("shelves", () => {
  const shelves = ref<ShelfSummary[]>([]);
  const loading = ref(false);
  const error = ref("");

  function message(e: unknown) {
    const err = e as { data?: { statusMessage?: string; message?: string } };
    return err.data?.statusMessage ?? err.data?.message ?? "Something went wrong";
  }

  async function fetchMine() {
    loading.value = true;
    try {
      shelves.value = await $fetch<ShelfSummary[]>("/api/shelves");
    }
    catch (e) {
      error.value = message(e);
    }
    finally {
      loading.value = false;
    }
  }

  async function create(dto: CreateShelfDTO) {
    error.value = "";
    try {
      const res = await $fetch<{ id: string }>("/api/shelves", { method: "POST", body: dto });
      await fetchMine();
      return res.id;
    }
    catch (e) {
      error.value = message(e);
      return null;
    }
  }

  async function update(id: string, dto: UpdateShelfDTO) {
    error.value = "";
    try {
      await $fetch(`/api/shelves/${id}` as string, { method: "PATCH", body: dto });
      await fetchMine();
      return true;
    }
    catch (e) {
      error.value = message(e);
      return false;
    }
  }

  async function remove(id: string) {
    await $fetch(`/api/shelves/${id}` as string, { method: "DELETE" });
    shelves.value = shelves.value.filter(s => s.id !== id);
  }

  async function addBook(shelfId: string, workId: string) {
    await $fetch(`/api/shelves/${shelfId}/books`, { method: "POST", body: { workId } });
  }

  async function removeBook(shelfId: string, workId: string) {
    await $fetch(`/api/shelves/${shelfId}/books`, { method: "DELETE", body: { workId } });
  }

  async function forBook(workId: string) {
    return $fetch<ShelfForBook[]>("/api/shelves/for-book", { query: { workId } });
  }

  return { shelves, loading, error, fetchMine, create, update, remove, addBook, removeBook, forBook };
});
