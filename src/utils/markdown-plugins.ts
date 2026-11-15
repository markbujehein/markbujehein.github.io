import type { RehypePlugin, RehypePlugins, RemarkPlugins } from "@astrojs/markdown-remark";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

// rehype-katex only records a warning on bad TeX and renders a red error span. Fail instead.
const failOnBadMath: RehypePlugin = () => (_tree, file) => {
  const bad = file.messages.find((m) => m.source === "rehype-katex");
  if (bad) throw new Error(`Invalid math: ${bad.message} (${bad.cause})`);
};

// Shared by astro.config.mjs and the markdown tests, so the test checks the real pipeline.
// Inline math needs $$...$$, so prices like "$5 and $10" stay text.
export const remarkPlugins: RemarkPlugins = [[remarkMath, { singleDollarTextMath: false }]];
export const rehypePlugins: RehypePlugins = [rehypeKatex, failOnBadMath];
