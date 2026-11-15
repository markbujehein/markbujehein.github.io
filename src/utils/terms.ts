export type Segment = { text: string } | { term: string };

/** Split text into plain text and marked terms. Whole-token, case-sensitive matches only. */
export function markTerms(text: string, terms: string[]): Segment[] {
  if (terms.length === 0) return [{ text }];
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const rx = new RegExp(`(?<![A-Za-z0-9])(${escaped.join("|")})(?![A-Za-z0-9])`, "g");
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(rx)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ term: m[1] });
    last = m.index + m[1].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out.length ? out : [{ text }];
}
