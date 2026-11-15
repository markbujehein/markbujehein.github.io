import { expect, test } from "@playwright/test";

const lastRingOpacity = (page: import("@playwright/test").Page) =>
  page
    .locator(".hero .ring")
    .last()
    .evaluate((el) => Number(getComputedStyle(el).opacity));

test("the hero rings fade into view on load", async ({ page }) => {
  await page.goto("/");
  // Seek the entrance animation instead of racing the clock: at its start the last ring is transparent, at its end visible.
  const opacityAt = (where: "start" | "end") =>
    page
      .locator(".hero .ring")
      .last()
      .evaluate((el, w) => {
        const entrance = el
          .getAnimations()
          .find((a) => (a as CSSAnimation).animationName === "ring-in")!;
        entrance.pause();
        if (w === "start") entrance.currentTime = 0;
        else entrance.finish();
        return Number(getComputedStyle(el).opacity);
      }, where);
  expect(await opacityAt("start")).toBeLessThan(1);
  expect(await opacityAt("end")).toBe(1);
});

test("with reduced motion the rings are visible at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await lastRingOpacity(page)).toBe(1);
});
