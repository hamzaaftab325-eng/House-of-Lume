import { expect, test } from "@playwright/test";

test.describe("Phase 4 catalogue discovery", () => {
  test("shop exposes polished catalogue controls and URL-backed filters", async ({ page }) => {
    await page.goto("/shop");

    await expect(
      page.getByRole("heading", { level: 1, name: /objects for considered living/i }),
    ).toBeVisible();
    await expect(page.getByText(/0 objects/i).first()).toBeVisible();
    await expect(page.getByLabel("Availability").first()).toBeVisible();

    await page.getByLabel("Availability").first().selectOption("in-stock");
    await page.getByRole("button", { name: /apply filters/i }).first().click();
    await expect(page).toHaveURL(/availability=in-stock/);
    await expect(page.getByTestId("catalogue-empty")).toBeVisible();
  });

  test("mobile filter drawer is keyboard-accessible", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/shop");

    await page.getByRole("button", { name: /filters/i }).click();
    await expect(page.getByRole("heading", { name: /refine the shelf/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: /refine the shelf/i })).toBeHidden();
  });

  test("search surface routes to a full results page", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("button", { name: "Search" }).click();
    await page.getByRole("searchbox", { name: /search house of lume/i }).fill("unlikely-object-query");
    await page.getByRole("button", { name: /^search$/i }).click();

    await expect(page).toHaveURL(/\/search\?q=unlikely-object-query/);
    await expect(page.getByRole("heading", { level: 1, name: /results for/i })).toBeVisible();
    await expect(page.getByTestId("catalogue-empty")).toBeVisible();
  });
});
