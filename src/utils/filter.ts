export function filterProjects<T extends { data: { category: string } }>(
  items: T[],
  category: string,
): T[] {
  return category === "all" ? [...items] : items.filter((i) => i.data.category === category);
}
