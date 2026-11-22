export function parsePaging(query: Record<string, unknown>, defaultSize = 24, maxSize = 48) {
  const page = Math.max(1, Number.parseInt(String(query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(maxSize, Math.max(1, Number.parseInt(String(query.pageSize ?? defaultSize), 10) || defaultSize));
  return { page, pageSize };
}
