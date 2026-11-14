// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

// User site (markbujehein.github.io): no `base`.
export default defineConfig({
  site: "https://markbujehein.github.io",

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

  integrations: [svelte()],

  vite: {
    plugins: [tailwindcss()],
  },
});
