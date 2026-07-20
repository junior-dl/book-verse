export function timestampToDateFormat(date: string | undefined | null) {
  if (!date)
    return "";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
