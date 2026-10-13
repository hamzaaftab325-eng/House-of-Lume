import { test, expect, type Page } from "@playwright/test";
const product = "Aurelia Floor Lamp";
async function add(page: Page) {
  await page.goto("/products/test-aurelia-floor-lamp");
  await page.getByRole("button", { name: "Add to Bag" }).click();
  await expect(page.getByText("Added to your bag", { exact: true })).toBeVisible();
}
test.describe("Phase 6 cart and wishlist", () => {
  test("server cart persists, quantity changes respect stock, remove and undo work", async ({
    page,
  }) => {
    await add(page);
    await page.goto("/cart");
    const main = page.getByRole("main");
    await expect(main.getByLabel(`${product} quantity`, { exact: true })).toHaveText("Qty 1");
    await main.getByRole("button", { name: `Increase ${product} quantity` }).click();
    await expect(main.getByLabel(`${product} quantity`, { exact: true })).toHaveText("Qty 2");
    await page.reload();
    await expect(main.getByLabel(`${product} quantity`, { exact: true })).toHaveText("Qty 2");
    await main.getByRole("button", { name: `Remove ${product} from bag` }).click();
    await expect(main.getByRole("heading", { name: "Your bag is quiet." })).toBeVisible();
    await main.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(main.getByLabel(`${product} quantity`, { exact: true })).toHaveText("Qty 2");
    await main.getByRole("button", { name: `Increase ${product} quantity` }).click();
    await expect(main.getByLabel(`${product} quantity`, { exact: true })).toHaveText("Qty 3");
    await expect(main.getByRole("button", { name: `Increase ${product} quantity` })).toBeDisabled();
  });
  test("guest wishlist persists and moves to the server bag", async ({ page }) => {
    await page.goto("/products/test-aurelia-floor-lamp");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("button", { name: "Saved", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.goto("/wishlist");
    await page.reload();
    const main = page.getByRole("main");
    await expect(main.getByText(product, { exact: true })).toBeVisible();
    await main.getByRole("button", { name: "Move to bag" }).click();
    await expect(main.getByRole("heading", { name: "Nothing saved yet." })).toBeVisible();
    await page.goto("/cart");
    await expect(
      page.getByRole("main").getByLabel(`${product} quantity`, { exact: true }),
    ).toHaveText("Qty 1");
  });
  test("discount is recalculated, invalid code is recoverable and successful code removable", async ({
    page,
  }) => {
    await add(page);
    await page.goto("/cart");
    const main = page.getByRole("main");
    await main.getByLabel("Discount code").fill("INVALID");
    await main.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(main.getByRole("alert")).toContainText("discount");
    await expect(main.getByLabel(`${product} quantity`, { exact: true })).toHaveText("Qty 1");
    await main.getByLabel("Discount code").fill("TEST10");
    await main.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(main.getByText("TEST10 applied")).toBeVisible();
    await expect(main.getByText(/−.*1,890/)).toBeVisible();
    await main.getByRole("button", { name: "Remove code" }).click();
    await expect(main.getByText("TEST10 applied")).toHaveCount(0);
  });
  test("legacy bag import is replay-safe and never trusts its displayed price", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem("seeded")) {
        localStorage.setItem(
          "dwellune-commerce-v1",
          JSON.stringify({
            bag: [
              {
                variantId: "11111111-1111-4111-8111-111111111301",
                quantity: 2,
                displayPricePkr: 1,
              },
            ],
            wishlist: [],
          }),
        );
        localStorage.setItem("seeded", "1");
      }
    });
    await page.goto("/cart");
    const main = page.getByRole("main");
    await expect(main.getByLabel(`${product} quantity`, { exact: true })).toHaveText("Qty 2");
    await expect(main.getByText(/37,800/).first()).toBeVisible();
    await page.reload();
    await expect(main.getByLabel(`${product} quantity`, { exact: true })).toHaveText("Qty 2");
  });
  test("mutations reject cross-site requests and forged client totals", async ({ request }) => {
    const cross = await request.post("/api/commerce", {
      headers: { origin: "https://evil.example" },
      data: { action: "add", variantId: "11111111-1111-4111-8111-111111111301", quantity: 1 },
    });
    expect(cross.status()).toBe(403);
    const forged = await request.post("/api/commerce", {
      headers: { origin: "http://127.0.0.1:3000" },
      data: {
        action: "add",
        variantId: "11111111-1111-4111-8111-111111111301",
        quantity: 1,
        unit_price_pkr: 1,
      },
    });
    expect(forged.status()).toBe(400);
  });
  test("network errors retain the bag and allow retry", async ({ page }) => {
    await add(page);
    await page.goto("/cart");
    const main = page.getByRole("main");
    await expect(main.getByLabel(`${product} quantity`, { exact: true })).toHaveText("Qty 1");
    await page.route("**/api/commerce**", async (route) => {
      if (route.request().method() === "POST") await route.abort();
      else await route.continue();
    });
    await main.getByRole("button", { name: `Increase ${product} quantity` }).click();
    await expect(main.getByRole("alert")).toBeVisible();
    await expect(main.getByLabel(`${product} quantity`, { exact: true })).toHaveText("Qty 1");
    await page.unroute("**/api/commerce**");
    await main.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(main.getByRole("alert")).toHaveCount(0);
  });
  for (const width of [320, 375, 430, 768, 1024, 1280, 1440, 1920])
    test(`cart/wishlist reflow and reduced motion at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await add(page);
      for (const route of ["/cart", "/wishlist"]) {
        await page.goto(route);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
          ),
        ).toBe(true);
      }
    });
  test("drawer uses native keyboard focus, Escape closes and full page link works", async ({
    page,
  }) => {
    await add(page);
    await page.getByRole("button", { name: "Shopping bag", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Shopping bag" });
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Tab");
    expect(await drawer.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();
    await page.getByRole("button", { name: "Shopping bag", exact: true }).click();
    await drawer.getByRole("link", { name: "Review your bag" }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole("dialog", { name: "Shopping bag" })).not.toBeVisible();
  });
});
