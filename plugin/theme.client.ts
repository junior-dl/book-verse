export default defineNuxtPlugin(() => {
  const theme = localStorage.getItem("theme") ?? "autumn";

  document.documentElement.dataset.theme = theme;
});
