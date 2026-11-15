import { expect, test } from "@playwright/test";

// These run against dist/, which `pnpm run build` fills with the Pagefind index.
const open = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: /^Search/ }).click();

test("the nav button opens the search dialog with the input focused", async ({ page }) => {
  await page.goto("/");
  await open(page);
  await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search the site" })).toBeFocused();
});

test("typing a word lists matching pages", async ({ page }) => {
  await page.goto("/");
  await open(page);
  await page.getByRole("searchbox", { name: "Search the site" }).fill("neutron");
  const hits = page.locator("#search-results a");
  await expect(hits.first()).toBeVisible();
  await expect(hits.first()).toHaveAttribute("href", /\S/);
});

test("a word that is not on the site says so", async ({ page }) => {
  await page.goto("/");
  await open(page);
  await page.getByRole("searchbox", { name: "Search the site" }).fill("zzqxjv");
  await expect(page.locator("#search-status")).toHaveText('Nothing found for "zzqxjv".');
});

test("/ and Ctrl+K open the dialog and Escape closes it", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Search" });
  await page.keyboard.press("/");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.keyboard.press("Control+k");
  await expect(dialog).toBeVisible();
});
