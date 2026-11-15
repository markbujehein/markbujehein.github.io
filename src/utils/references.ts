// One source, one record: formatted in IEEE style here, so no page formats a citation by hand.

export type Reference = {
  type: "encyclopedia";
  author: string; // an organisation ("Elsevier") or "A. Author"
  title: string; // the entry title, without quotes
  site: string; // the work it appears in, shown in italics
  url: string;
  accessed: string; // YYYY-MM-DD
};

export type Part = { text: string } | { italic: string } | { link: string; href: string };

// IEEE abbreviates only these months; March to July stay in full.
const MONTHS = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];

export function ieeeDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

/** Throws with the key and the problem, so a bad record fails the build instead of printing nonsense. */
export function assertReference(key: string, ref: unknown): asserts ref is Reference {
  const r = ref as Record<string, unknown>;
  if (r?.type !== "encyclopedia") throw new Error(`Reference "${key}": unknown type "${String(r?.type)}"`);
  for (const field of ["author", "title", "site", "url", "accessed"]) {
    if (typeof r[field] !== "string" || !r[field]) throw new Error(`Reference "${key}": missing "${field}"`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.accessed as string)) {
    throw new Error(`Reference "${key}": "accessed" must be YYYY-MM-DD`);
  }
}

/** IEEE: Author, "Title," Site. [Online]. Available: URL. [Accessed: Mon. D, YYYY]. */
export function formatIeee(ref: Reference): Part[] {
  const shown = ref.url.replace(/^https?:\/\/(www\.)?/, "");
  return [
    { text: `${ref.author}, “${ref.title},” ` },
    { italic: ref.site },
    { text: ". [Online]. Available: " },
    { link: shown, href: ref.url },
    { text: `. [Accessed: ${ieeeDate(ref.accessed)}].` },
  ];
}
