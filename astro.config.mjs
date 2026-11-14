// @ts-check
import { defineConfig, fontProviders } from "astro/config";

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
});
