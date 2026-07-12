import tailwindcss from "@tailwindcss/vite";

import "./lib/env";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  srcDir: ".",
  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@pinia/nuxt",
    "vue3-carousel-nuxt",
  ],
  eslint: {
    config: {
      standalone: false,
    },
  },
  css: ["~/assets/css/main.css", "~/assets/css/carousel.css", "vue3-carousel/carousel.css"],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  colorMode: {
    dataValue: "theme",
    fallback: "autumn",
  },
});
