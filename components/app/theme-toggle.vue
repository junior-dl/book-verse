<script setup lang="ts">
const { theme, applyTheme } = useTheme();

const isDark = computed({
  get: () => theme.value === "luxury",
  set: (value) => {
    applyTheme(value ? "luxury" : "autumn");
  },
});
</script>

<template>
  <button class="btn btn-neutral rounded-full contain h-10 w-10">
    <label class="swap swap-rotate">
      <!-- this hidden checkbox controls the state -->
      <input v-model="isDark" type="checkbox">
      <!-- sun icon -->
      <Icon class="swap-on" name="material-symbols:dark-mode" size="30" />
      <!-- moon icon -->
      <Icon class="swap-off" name="material-symbols:light-mode" size="30" />
    </label>
  </button>
</template>
