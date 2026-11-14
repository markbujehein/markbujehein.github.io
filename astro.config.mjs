// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";

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
    {
      provider: fontProviders.fontsource(),
      name: "Atkinson Hyperlegible",
      cssVariable: "--font-body",
      weights: [400, 700],
      styles: ["normal"],
      fallbacks: ["system-ui", "sans-serif"],
    },
  ],

  experimental: {
    parallelPrerender: true,
    incrementalBuild: true,
  },

  prefetch: true,

  integrations: [preact()],

  vite: {
    plugins: [tailwindcss()],
  },
});
