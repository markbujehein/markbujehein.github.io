import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { contrastRatio } from "./contrast";

// global.css is the single source of the palette; read the tokens from it.
const css = readFileSync(new URL("../styles/global.css", import.meta.url), "utf8");
const token = (name: string): string => {
  const hex = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
  if (!hex) throw new Error(`Missing token --color-${name}`);
  return hex;
};

test("contrastRatio matches the WCAG reference values", () => {
  expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  expect(contrastRatio("#14092e", "#f4f1fa")).toBeGreaterThanOrEqual(12);
});

const light: [string, string][] = [
  ["lampblack-ink", "sunlit-vellum"], // headings
  ["lampblack-ink-lighter", "sunlit-vellum"], // body
  ["silverpoint", "sunlit-vellum"], // muted
  ["spice-melange", "sunlit-vellum"], // links
  ["oracle-core", "sunlit-vellum"], // keywords
  ["arcane-intellect", "sunlit-vellum"], // hover and focus
  ["lampblack-ink-lighter", "illuminated-leaf"], // text on cards
  ["silverpoint", "illuminated-leaf"],
  ["spice-melange", "illuminated-leaf"],
  ["oracle-core", "illuminated-leaf"],
];
const dark: [string, string][] = [
  ["lunar-vellum", "iron-gall"], // headings
  ["lunar-vellum-darker", "iron-gall"], // body
  ["marginalia", "iron-gall"], // muted
  ["gravity-gun", "iron-gall"], // links
  ["athena-core", "iron-gall"], // keywords
  ["arcane-torrent", "iron-gall"], // hover and focus
  ["lunar-vellum-darker", "midnight-codex"], // text on cards
  ["marginalia", "midnight-codex"],
  ["gravity-gun", "midnight-codex"],
  ["athena-core", "midnight-codex"],
];

test.each(light)("light theme: %s on %s is at least 4.5:1", (fg, bg) => {
  expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
});
test.each(dark)("dark theme: %s on %s is at least 4.5:1", (fg, bg) => {
  expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
});
test.each([
  ["lunar-vellum", "tyrian-folio"], // hero text
  ["gravity-gun", "tyrian-folio"], // hero accent
  ["arcane-torrent", "tyrian-folio"], // hero button hover
])("hero: %s on %s is at least 4.5:1", (fg, bg) => {
  expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
});

// Filled buttons and the selected filter chip: label on fill.
test.each([
  ["sunlit-vellum", "spice-melange"],
  ["sunlit-vellum", "arcane-intellect"],
  ["iron-gall", "gravity-gun"],
  ["iron-gall", "arcane-torrent"],
  ["tyrian-folio", "gravity-gun"], // hero button
  ["tyrian-folio", "arcane-torrent"],
])("button label: %s on %s is at least 4.5:1", (fg, bg) => {
  expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
});
