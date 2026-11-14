import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

// Shared by astro.config.mjs and the markdown tests, so the test checks the real pipeline.
export const remarkPlugins = [remarkMath];
export const rehypePlugins = [rehypeKatex];
