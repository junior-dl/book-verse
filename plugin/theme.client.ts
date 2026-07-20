export default defineNuxtPlugin(() => {
  const theme = localStorage.getItem("theme") ?? "bumblebee";

  document.documentElement.dataset.theme = theme;
});
