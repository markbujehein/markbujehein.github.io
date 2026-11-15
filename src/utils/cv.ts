import type { CollectionEntry } from "astro:content";

export type CVSection = CollectionEntry<"cv">["data"];

// The Pelican importer escaped "&" for Jinja; Astro escapes on output, so undo it once.
export function decodeEntities(text: string): string {
  return text.replaceAll("&amp;", "&");
}

// getCollection() order is not guaranteed; the data files carry an explicit `order`.
export function sortByOrder<T extends { data: { order: number } }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => a.data.order - b.data.order);
}
