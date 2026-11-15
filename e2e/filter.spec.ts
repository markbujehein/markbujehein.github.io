import { expect, test } from "@playwright/test";

test("the project filter shows one category and All restores the list", async ({ page }) => {
  await page.goto("/projects/");
  const cards = page.locator("[data-project]");
  const all = await cards.count();
  const group = page.getByRole("group", { name: "Filter projects" });

  await group.getByRole("button", { name: /software/i }).click();
  const shown = page.locator("[data-project]:not([hidden])");
  expect(await shown.count()).toBeLessThan(all);
  for (const category of await shown.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.category))) {
    expect(category).toBe("software");
  }
  await expect(group.getByRole("button", { name: /software/i })).toHaveAttribute("aria-pressed", "true");

  await group.getByRole("button", { name: /^all/i }).click();
  await expect(page.locator("[data-project]:not([hidden])")).toHaveCount(all);
});
