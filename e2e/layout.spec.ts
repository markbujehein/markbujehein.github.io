import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

for (const path of ["/", "/projects/", "/cv/", "/skills/ins/"]) {
  test(`${path} has no horizontal scroll at 390px`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
