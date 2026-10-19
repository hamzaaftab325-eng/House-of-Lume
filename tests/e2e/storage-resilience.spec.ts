import { expect, test } from "@playwright/test";

test("product and purchase controls remain usable when browser storage is blocked", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Storage is blocked", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage is full", "QuotaExceededError");
    };
  });
  await page.goto("/products/test-aurelia-floor-lamp");
  await expect(page.getByRole("heading", { level: 1, name: "Aurelia Floor Lamp" })).toBeVisible();
  await page.getByRole("button", { name: /Ink Black/ }).click();
  await expect(page.getByRole("button", { name: "Currently unavailable" })).toBeDisabled();
  await page.getByRole("button", { name: /Warm Brass/ }).click();
  await expect(page.getByRole("button", { name: "Add to Bag" })).toBeEnabled();
  await page.getByRole("button", { name: "Add to Bag" }).click();
  await expect(page.getByText("Added to your bag", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("keyboard search navigation does not depend on saving recent searches", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage is full", "QuotaExceededError");
    };
  });
  await page.route("**/api/search?*", (route) =>
    route.fulfill({
      json: {
        products: [
          { name: "Aurelia Floor Lamp", slug: "test-aurelia-floor-lamp", product_type: "lighting" },
        ],
        categories: [],
        collections: [],
      },
    }),
  );
  await page.goto("/shop");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("searchbox", { name: "Search DWELLUNE" });
  await search.fill("Aurelia");
  await expect(page.getByRole("option", { name: /Aurelia Floor Lamp/ })).toBeVisible();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/products\/test-aurelia-floor-lamp$/);
  await expect(page.getByRole("heading", { level: 1, name: "Aurelia Floor Lamp" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("recent search controls remain usable when storage removal is denied", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("dwellune-recent-searches", JSON.stringify(["Lighting"]));
    Storage.prototype.removeItem = () => {
      throw new DOMException("Storage is blocked", "SecurityError");
    };
  });
  await page.goto("/shop");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Recent searches" })).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Recent searches" })).toHaveCount(0);
  await expect(
    page.getByRole("dialog").getByRole("link", { name: "Shop all", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
