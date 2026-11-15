import { expect, test } from "@playwright/test";

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("dark mode follows the system setting", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(15, 10, 36)"); // iron-gall
  });

  test("light mode is the default", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(248, 246, 255)"); // sunlit-vellum
  });

  test("controls that need JavaScript are hidden", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Dark theme" })).toBeHidden();
    await expect(page.locator("#search-open")).toBeHidden();
    await page.goto("/projects/");
    await expect(page.getByRole("group", { name: "Filter projects" })).toBeHidden();
  });
});
