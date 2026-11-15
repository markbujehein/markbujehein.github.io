import type { RehypePlugin, RehypePlugins, RemarkPlugins } from "@astrojs/markdown-remark";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { remarkCitations } from "./remark-citations";

// rehype-katex only records a warning on bad TeX and renders a red error span. Fail instead.
const failOnBadMath: RehypePlugin = () => (_tree, file) => {
  const bad = file.messages.find((m) => m.source === "rehype-katex");
  if (bad) throw new Error(`Invalid math: ${bad.message} (${bad.cause})`);
};

type HastNode = { type: string; tagName?: string; properties?: object; children?: HastNode[] };

// Wrap every table in a scrolling container (see .table-wrap in global.css).
const wrapTables: RehypePlugin = () => (tree) => {
  const walk = (node: HastNode) => {
    node.children?.forEach((child, i) => {
      if (child.type === "element" && child.tagName === "table") {
        node.children![i] = {
          type: "element",
          tagName: "div",
          properties: { className: ["table-wrap"] },
          children: [child],
        };
      } else walk(child);
    });
  };
  walk(tree as HastNode);
};

// Shared by astro.config.mjs and the markdown tests, so the test checks the real pipeline.
// Inline math needs $$...$$, so prices like "$5 and $10" stay text.
export const remarkPlugins: RemarkPlugins = [
  [remarkMath, { singleDollarTextMath: false }],
  remarkCitations,
];
export const rehypePlugins: RehypePlugins = [rehypeKatex, failOnBadMath, wrapTables];
