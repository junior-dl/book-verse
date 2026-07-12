export function useTheme() {
  const theme = useState<"autumn" | "luxury">("theme", () => "autumn");

  const applyTheme = (value: "autumn" | "luxury") => {
    theme.value = value;

    if (import.meta.client) {
      document.documentElement.dataset.theme = value;
      localStorage.setItem("theme", value);
    }
  };

  onMounted(() => {
    const saved = localStorage.getItem("theme") as
      | "autumn"
      | "luxury"
      | null;

    applyTheme(saved ?? "autumn");
  });

  return {
    theme,
    applyTheme,
  };
}
