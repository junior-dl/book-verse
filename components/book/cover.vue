<script setup lang="ts">
const props = withDefaults(defineProps<{
  src?: string | null;
  title: string;
  author?: string;
  size?: "sm" | "lg";
}>(), { src: null, author: "", size: "sm" });

// Show the themed placeholder when there is no URL or the image fails to load
// (e.g. a provider is down for maintenance).
const failed = ref(false);
const loaded = ref(false);
watch(() => props.src, () => {
  failed.value = false;
  loaded.value = false;
});
const showImage = computed(() => !!props.src && !failed.value);

// Server-rendered images can fail before hydration, when @error isn't attached yet.
const imgEl = ref<HTMLImageElement | null>(null);
// A provider that is down may never answer — fall back instead of showing a blank box.
const TIMEOUT_MS = 8000;
let timer: ReturnType<typeof setTimeout> | undefined;
onMounted(() => {
  const img = imgEl.value;
  if (img?.complete) {
    if (img.naturalWidth === 0)
      failed.value = true;
    else
      loaded.value = true;
    return;
  }
  timer = setTimeout(() => {
    if (!loaded.value)
      failed.value = true;
  }, TIMEOUT_MS);
});
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="relative h-full w-full overflow-hidden rounded-lg bg-neutral text-neutral-content">
    <img
      v-if="showImage"
      ref="imgEl"
      :src="props.src!"
      :alt="props.title"
      class="h-full w-full object-cover"
      @load="loaded = true"
      @error="failed = true"
    >

    <div
      v-else
      class="flex h-full w-full flex-col items-center justify-between bg-gradient-to-b from-neutral to-base-300 text-center"
      :class="props.size === 'lg' ? 'p-6' : 'p-3'"
      role="img"
      :aria-label="`${props.title} — cover not yet available`"
    >
      <div class="h-1 w-1/3 rounded-full bg-primary opacity-80" />

      <div class="flex flex-col items-center gap-2">
        <Icon name="tabler:book-2" :size="props.size === 'lg' ? '56' : '36'" class="opacity-70" />
        <p
          class="line-clamp-3 font-serif font-bold leading-tight"
          :class="props.size === 'lg' ? 'text-xl' : 'text-sm'"
        >
          {{ props.title }}
        </p>
        <p v-if="props.author" class="line-clamp-1 text-xs opacity-70">
          {{ props.author }}
        </p>
      </div>

      <p class="text-[0.6rem] font-semibold uppercase tracking-widest opacity-60">
        Cover not yet available
      </p>
    </div>
  </div>
</template>
