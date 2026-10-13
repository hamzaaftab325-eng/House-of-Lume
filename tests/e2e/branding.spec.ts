import { expect, test } from "@playwright/test";

test.describe("DWELLUNE brand shell", () => {
  test("header logo remains available after homepage scroll", async ({ page }) => {
    await page.goto("/");

    const header = page.getByRole("banner");
    const logo = page.getByRole("img", { name: "DWELLUNE Home Décor" }).first();

    await expect(header).toBeVisible();
    await expect(logo).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect(header).toHaveAttribute("data-scrolled", "true");
    await expect(header).toBeVisible();
    await expect(logo).toBeVisible();

    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    if (box) expect(box.y).toBeGreaterThanOrEqual(-1);
  });

  test("store metadata and search use DWELLUNE branding", async ({ page }) => {
    await page.goto("/shop");
    await expect(page).toHaveTitle(/DWELLUNE/i);

    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("searchbox", { name: "Search DWELLUNE" })).toBeFocused();
  });
});
