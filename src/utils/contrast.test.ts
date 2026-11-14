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
  ["ink-950", "paper-50"], // headings
  ["ink-700", "paper-50"], // body
  ["ink-600", "paper-50"], // muted
  ["accent-700", "paper-50"], // accent text and links
  ["ink-700", "paper-100"], // text on tinted panels
];
const dark: [string, string][] = [
  ["paper-50", "ink-950"],
  ["paper-300", "ink-950"], // body
  ["paper-400", "ink-950"], // muted
  ["accent-300", "ink-950"], // accent text and links
  ["paper-300", "ink-900"], // text on cards
];

test.each(light)("light theme: %s on %s is at least 4.5:1", (fg, bg) => {
  expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
});
test.each(dark)("dark theme: %s on %s is at least 4.5:1", (fg, bg) => {
  expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
});
test("hero accent on the hero background is at least 4.5:1", () => {
  expect(contrastRatio("#fe9f6d", "#14092e")).toBeGreaterThanOrEqual(4.5);
});
