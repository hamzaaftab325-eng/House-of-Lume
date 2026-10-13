import { expect, test } from "@playwright/test";

async function expectNoPageOverflow(page: import("@playwright/test").Page) {
  const hasNoOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(hasNoOverflow).toBe(true);
}

test("home product shelf renders an honest editorial preview", async ({ page }) => {
  await page.goto("/#products");

  await expect(page.getByRole("heading", { name: "Objects for a Brighter Home" })).toBeVisible();
  await expect(page.getByText(/the catalogue is now open/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /explore the catalogue/i })).toHaveAttribute(
    "href",
    "/shop",
  );

  for (const product of [
    "Aurelia Lamp",
    "Soleto Planter",
    "Forma Object",
    "Verdant Planter",
    "Lume Candle Bowl",
  ]) {
    await expect(page.getByRole("heading", { name: product, exact: true })).toBeVisible();
  }

  const productList = page.getByRole("list", { name: "Product editorial preview" });
  await expect(productList.getByRole("listitem")).toHaveCount(5);
  await expectNoPageOverflow(page);
});

test("home product shelf stays usable across responsive widths", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const width of [320, 375, 768, 1024, 1440] as const) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
    await page.goto("/#products");

    await expect(page.getByRole("heading", { name: "Objects for a Brighter Home" })).toBeVisible();
    await expectNoPageOverflow(page);

    const firstProduct = page.getByRole("heading", { name: "Aurelia Lamp", exact: true });
    await expect(firstProduct).toBeVisible();
    const box = await firstProduct.boundingBox();
    expect(box).not.toBeNull();
    if (!box) continue;
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
  }
});
