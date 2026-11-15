import { expect, test } from "@playwright/test";

const lastRingOpacity = (page: import("@playwright/test").Page) =>
  page.locator(".hero .ring").last().evaluate((el) => Number(getComputedStyle(el).opacity));

test("the hero rings fade into view on load", async ({ page }) => {
  await page.goto("/");
  // The last ring starts after a delay, so right after load it is still transparent.
  expect(await lastRingOpacity(page)).toBeLessThan(1);
  await expect.poll(() => lastRingOpacity(page), { timeout: 5000 }).toBe(1);
});

test("with reduced motion the rings are visible at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await lastRingOpacity(page)).toBe(1);
});
