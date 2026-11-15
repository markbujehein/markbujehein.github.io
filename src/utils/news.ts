export function latest<T extends { data: { date: Date } }>(entries: T[], limit: number): T[] {
  return [...entries].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()).slice(0, limit);
}
