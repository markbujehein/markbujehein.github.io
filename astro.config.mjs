// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { rehypePlugins, remarkPlugins } from "./src/utils/markdown-plugins";

// User site (markbujehein.github.io): no `base`.
export default defineConfig({
  site: "https://markbujehein.github.io",

  // Dev server only: Astro never ships the toolbar in `astro build` output.
  devToolbar: { enabled: true },

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Source Serif 4",
      cssVariable: "--font-serif",
      weights: [700],
      styles: ["normal"],
      fallbacks: ["Georgia", "serif"],
    },
  ],

  experimental: {
    parallelPrerender: true,
    incrementalBuild: true,
  },

  // Prefetch links as they scroll into view; the site is small, so this is cheap.
  prefetch: { prefetchAll: true, defaultStrategy: "viewport" },

  // KaTeX math in Markdown: $inline$ and $$ blocks $$, rendered at build time.
  markdown: {
    processor: unified({
      remarkPlugins,
      rehypePlugins,
      // Footnotes are the site's reference list: a visible "References" heading instead of the hidden "Footnotes".
      remarkRehype: {
        footnoteLabel: "References",
        footnoteLabelProperties: { className: ["references-title"] },
      },
    }),
  },

  integrations: [preact(), mdx(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
