export function sortByImportance<T extends { data: { importance: number } }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => a.data.importance - b.data.importance);
}

export function groupByCategory<T extends { id: string; data: { category: string } }>(
  entries: T[],
  categories: readonly string[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>(categories.map((c) => [c, []]));
  for (const entry of entries) {
    const group = groups.get(entry.data.category);
    if (!group) {
      throw new Error(`Project "${entry.id}" has category "${entry.data.category}", not one of: ${categories.join(", ")}`);
    }
    group.push(entry);
  }
  return groups;
}
