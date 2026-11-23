<script setup lang="ts">
import type { ShelfSummary } from "~/shared/types";

const props = defineProps<{ shelf?: Pick<ShelfSummary, "id" | "name" | "description" | "isPublic"> | null }>();
const emit = defineEmits<{ saved: [id: string] }>();

const store = useShelvesStore();
const dialog = ref<HTMLDialogElement | null>(null);
const name = ref("");
const description = ref("");
const isPublic = ref(false);
const saving = ref(false);

function open() {
  name.value = props.shelf?.name ?? "";
  description.value = props.shelf?.description ?? "";
  isPublic.value = props.shelf?.isPublic ?? false;
  store.error = "";
  dialog.value?.showModal();
}

async function save() {
  saving.value = true;
  const dto = { name: name.value, description: description.value || null, isPublic: isPublic.value };
  const id = props.shelf
    ? ((await store.update(props.shelf.id, dto)) ? props.shelf.id : null)
    : await store.create(dto);
  saving.value = false;
  if (id) {
    dialog.value?.close();
    emit("saved", id);
  }
}

defineExpose({ open });
</script>

<template>
  <dialog ref="dialog" class="modal modal-bottom sm:modal-middle">
    <form class="modal-box flex flex-col gap-4" @submit.prevent="save">
      <h3 class="text-lg font-bold">
        {{ props.shelf ? "Edit shelf" : "New shelf" }}
      </h3>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-semibold">Name</span>
        <input v-model="name" class="input input-bordered w-full" maxlength="60" required placeholder="e.g. Summer reads">
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-semibold">Description <span class="font-normal opacity-60">(optional)</span></span>
        <textarea v-model="description" class="textarea textarea-bordered w-full" maxlength="300" rows="2" />
      </label>

      <label class="flex cursor-pointer items-center gap-3">
        <input v-model="isPublic" type="checkbox" class="toggle toggle-primary">
        <span>Public — anyone with the link can see it</span>
      </label>

      <p v-if="store.error" class="text-sm text-error">
        {{ store.error }}
      </p>

      <div class="modal-action">
        <button type="button" class="btn btn-ghost" @click="dialog?.close()">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving || !name.trim()">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Save
        </button>
      </div>
    </form>
    <form method="dialog" class="modal-backdrop">
      <button aria-label="Close">
        close
      </button>
    </form>
  </dialog>
</template>
