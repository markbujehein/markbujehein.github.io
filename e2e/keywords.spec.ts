import { expect, test } from "@playwright/test";

type Locator = import("@playwright/test").Locator;

const term = (page: import("@playwright/test").Page, t: string) =>
  page.locator("a.keyword", { hasText: t }).first();

// The tooltip is the keyword's sibling inside the same wrapper.
const tipOf = (keyword: Locator) => keyword.locator("xpath=../*[contains(@class,'keyword-tip')]");

test("hovering a keyword shows its definition; clicking opens its page", async ({ page }) => {
  await page.goto("/");
  const ins = term(page, "INS");
  const tip = tipOf(ins);
  await expect(tip).toBeHidden();
  await ins.hover();
  await expect(tip).toBeVisible();
  await expect(tip).toContainText("Inelastic neutron scattering");
  await ins.click();
  await expect(page).toHaveURL(/\/skills\/ins\/$/);
});

test("keyboard focus shows the same tooltip", async ({ page }) => {
  await page.goto("/");
  const ins = term(page, "INS");
  await ins.focus();
  await expect(tipOf(ins)).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the tooltip and the link still work", async ({ page }) => {
    await page.goto("/");
    const ins = term(page, "INS");
    await ins.hover();
    await expect(tipOf(ins)).toBeVisible();
    await expect(ins).toHaveAttribute("href", "/skills/ins/");
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the tooltip stays inside the viewport for every keyword", async ({ page }) => {
    await page.goto("/");
    const keywords = page.locator("a.keyword");
    for (let i = 0; i < (await keywords.count()); i++) {
      const k = keywords.nth(i);
      await k.scrollIntoViewIfNeeded();
      await k.hover();
      const box = await tipOf(k).boundingBox();
      expect(box, `tooltip ${i}`).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }
  });
});
