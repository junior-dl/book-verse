export function useTheme() {
  const theme = useState<"bumblebee" | "luxury">("theme", () => "bumblebee");

  const applyTheme = (value: "bumblebee" | "luxury") => {
    theme.value = value;

    if (import.meta.client) {
      document.documentElement.dataset.theme = value;
      localStorage.setItem("theme", value);
    }
  };

  onMounted(() => {
    const saved = localStorage.getItem("theme") as
      | "bumblebee"
      | "luxury"
      | null;

    applyTheme(saved ?? "bumblebee");
  });

  return {
    theme,
    applyTheme,
  };
}
