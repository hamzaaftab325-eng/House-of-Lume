import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const hasNoOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(hasNoOverflow).toBe(true);
}

test("shop renders live catalogue controls and a truthful empty state", async ({ page }) => {
  await page.goto("/shop");

  await expect(page.getByRole("heading", { name: "Objects for warmer living." })).toBeVisible();
  await expect(page.getByLabel("Catalogue controls")).toBeVisible();
  await expect(page.getByTestId("catalogue-empty-state")).toBeVisible();
  await expect(
    page.getByText("The catalogue is ready for its first published objects."),
  ).toBeVisible();
});

test("catalogue filters are URL synchronized and clearable", async ({ page }) => {
  await page.goto("/shop");

  await page.getByRole("combobox", { name: "Category" }).selectOption("lighting");
  await page.getByRole("radio", { name: "In stock" }).check();
  await page.getByRole("button", { name: /Show 0 objects/ }).click();

  await expect(page).toHaveURL(/category=lighting/);
  await expect(page).toHaveURL(/availability=in-stock/);
  await expect(page.getByText("Nothing meets this combination yet.")).toBeVisible();

  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/shop$/);
});

test("category and collection routes use real production baseline records", async ({ page }) => {
  await page.goto("/categories/lighting");
  await expect(page.getByRole("heading", { name: "Lighting", level: 1 })).toBeVisible();

  await page.goto("/collections/new-arrivals");
  await expect(page.getByRole("heading", { name: "New Arrivals", level: 1 })).toBeVisible();
});

test("unknown catalogue slugs use the application not-found path", async ({ page }) => {
  const response = await page.goto("/categories/not-a-real-category");
  expect(response?.status()).toBe(404);
});

test("predictive search returns categories and supports keyboard navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();

  const searchbox = page.getByRole("searchbox", { name: "Search House of Lume" });
  await searchbox.fill("light");
  await expect(page.getByRole("option", { name: /Lighting/ })).toBeVisible();

  await searchbox.press("ArrowDown");
  await searchbox.press("Enter");
  await expect(page).toHaveURL(/categories\/lighting|search\?q=/);
});

test("mobile filters use an accessible drawer without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/shop");

  await page.getByRole("button", { name: /^Filters/ }).click();
  const drawer = page.getByRole("dialog", { name: "Refine the edit" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("combobox", { name: "Category" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("catalogue does not overflow supported storefront widths", async ({ page }) => {
  for (const width of [320, 375, 430, 768, 1024, 1440, 1920] as const) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
    await page.goto("/shop");
    await expectNoHorizontalOverflow(page);
  }
});
