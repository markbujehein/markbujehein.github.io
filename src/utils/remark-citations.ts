import { readFileSync } from "node:fs";
import type { RemarkPlugin } from "@astrojs/markdown-remark";
import { type Part, type Reference, assertReference, formatIeee } from "./references";

type Node = { type: string; value?: string; children?: Node[]; [key: string]: unknown };

const CITE = /\[@([A-Za-z0-9_-]+)\]/g;
const SKIP = new Set(["link", "linkReference", "code", "inlineCode"]);

function loadReferences(): Record<string, Reference> {
  const raw = JSON.parse(readFileSync(new URL("../data/references.json", import.meta.url), "utf8"));
  for (const [key, ref] of Object.entries(raw)) assertReference(key, ref);
  return raw;
}

const phrasing = (part: Part): Node =>
  "italic" in part
    ? { type: "emphasis", children: [{ type: "text", value: part.italic }] }
    : "link" in part
      ? { type: "link", url: part.href, children: [{ type: "text", value: part.link }] }
      : { type: "text", value: part.text };

/**
 * Turns [@key] into a numbered [n] link and appends a "References" list in IEEE style, from
 * src/data/references.json. Works in .md and .mdx. An unknown key throws, so the build fails.
 */
export const remarkCitations: RemarkPlugin<[{ references?: Record<string, Reference> }?]> =
  (options) => (tree, file) => {
    const refs = options?.references ?? loadReferences();
    const order: string[] = [];

    const walk = (node: Node) => {
      if (!node.children || SKIP.has(node.type)) return;
      node.children = node.children.flatMap((child): Node[] => {
        if (child.type !== "text" || !child.value?.includes("[@")) {
          walk(child);
          return [child];
        }
        const out: Node[] = [];
        let last = 0;
        for (const m of child.value.matchAll(CITE)) {
          const key = m[1];
          if (!refs[key]) {
            throw new Error(`Unknown citation key "${key}" in ${file.path ?? "a markdown file"}: add it to src/data/references.json`);
          }
          if (!order.includes(key)) order.push(key);
          if (m.index > last) out.push({ type: "text", value: child.value.slice(last, m.index) });
          out.push({
            type: "cite",
            data: { hName: "a", hProperties: { className: ["cite"], href: `#ref-${order.indexOf(key) + 1}` } },
            children: [{ type: "text", value: `[${order.indexOf(key) + 1}]` }],
          });
          last = m.index + m[0].length;
        }
        if (last < child.value.length) out.push({ type: "text", value: child.value.slice(last) });
        return out;
      });
    };
    walk(tree as Node);
    if (order.length === 0) return;

    (tree as Node).children!.push({
      type: "references",
      data: { hName: "section", hProperties: { className: ["references"] } },
      children: [
        {
          type: "heading",
          depth: 2,
          data: { hProperties: { className: ["references-title"] } },
          children: [{ type: "text", value: "References" }],
        },
        {
          type: "list",
          ordered: true,
          spread: false,
          children: order.map((key, i) => ({
            type: "listItem",
            spread: false,
            data: { hProperties: { id: `ref-${i + 1}` } },
            children: [{ type: "paragraph", children: formatIeee(refs[key]).map(phrasing) }],
          })),
        },
      ],
    });
  };
