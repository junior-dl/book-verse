import tailwindcss from "@tailwindcss/vite";

import "./lib/env";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  srcDir: ".",
  app: {
    head: {
      title: "BookVerse",
      meta: [
        { name: "description", content: "BookVerse — a digital library of free classics and in-print books." },
        { name: "theme-color", content: "#0F172A" },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "48x48" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap" },
      ],
    },
  },
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
});
