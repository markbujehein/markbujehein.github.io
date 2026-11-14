// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import { unified } from "@astrojs/markdown-remark";
import preact from "@astrojs/preact";
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

  prefetch: true,

  // KaTeX math in Markdown: $inline$ and $$ blocks $$, rendered at build time.
  markdown: { processor: unified({ remarkPlugins, rehypePlugins }) },

  integrations: [preact()],

  vite: {
    plugins: [tailwindcss()],
  },
});
