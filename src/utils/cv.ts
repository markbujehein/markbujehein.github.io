import type { CollectionEntry } from "astro:content";

export type CVSection = CollectionEntry<"cv">["data"];

// The Pelican importer escaped "&" for Jinja; Astro escapes on output, so undo it once.
export function decodeEntities(text: string): string {
  return text.replaceAll("&amp;", "&");
}
