import { expect, test, type Page } from "@playwright/test";
import type { Cart } from "../../src/lib/commerce";
async function setup(page: Page, enabled = true) {
  await page.route("**/api/checkout", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: {
          ordersEnabled: enabled,
          authenticated: false,
          email: "",
          name: "",
          phone: "",
          addresses: [],
          returnPolicy: "Eligible returns within seven days.",
        },
      });
    const response = await page.request.get("/api/commerce");
    const { cart } = (await response.json()) as { cart: Cart };
    await route.fulfill({
      json: {
        cart,
        revision: "a".repeat(64),
        quoted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 300000).toISOString(),
        delivery: {
          name: "Standard",
          zone: "Pakistan",
          surcharge_pkr: 0,
          cod_min_pkr: 0,
          cod_max_pkr: null,
        },
        needs_stock_revalidation: false,
        contains_test_product: false,
      },
    });
  });
  await page.goto("/products/test-aurelia-floor-lamp");
  await page.getByRole("button", { name: "Add to Bag" }).click();
  await expect(page.getByText("Added to your bag", { exact: true })).toBeVisible();
  await page.goto("/checkout");
  await page.getByLabel("Full name", { exact: true }).fill("Checkout tester");
  await page.getByLabel("Email address", { exact: true }).fill("test@example.invalid");
  await page.getByLabel("Mobile number", { exact: true }).fill("03001234567");
  await page.getByLabel("Street address", { exact: true }).fill("Test street 123");
  await page.getByLabel("City", { exact: true }).fill("Lahore");
  await page.getByLabel("I have reviewed the delivery, COD and return information.").check();
  await page.getByRole("button", { name: "Review checkout", exact: true }).click();
  await expect(
    page.getByText("Your address and current totals have been checked. No order has been placed.", {
      exact: true,
    }),
  ).toBeVisible();
}
test("address changes invalidate review and configuration closes order placement", async ({
  page,
}) => {
  await setup(page, false);
  await expect(
    page.getByRole("button", { name: "Order placement awaits configuration" }),
  ).toBeDisabled();
  await page.getByLabel("City", { exact: true }).fill("Karachi");
  await expect(
    page.getByText(
      "Enter your address and review checkout to confirm delivery eligibility and total.",
      { exact: true },
    ),
  ).toBeVisible();
});
test("uncertain submission keeps the same payload and attempt ID for retry", async ({ page }) => {
  const bodies: unknown[] = [];
  await page.route("**/api/checkout/orders", async (route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({
      status: 503,
      json: { error: "Temporary network failure", code: "order_failed" },
    });
  });
  await setup(page);
  await page.getByRole("button", { name: "Place Cash on Delivery order" }).click();
  await expect(page.getByRole("button", { name: "Retry same order attempt" })).toBeEnabled();
  await expect(page.getByLabel("Full name", { exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Retry same order attempt" }).click();
  await expect.poll(() => bodies.length).toBe(2);
  expect(bodies[1]).toEqual(bodies[0]);
});
test("stale totals require a new review before another submit", async ({ page }) => {
  await page.route("**/api/checkout/orders", (route) =>
    route.fulfill({
      status: 409,
      json: { error: "Your quote changed. Review again.", code: "quote_changed" },
    }),
  );
  await setup(page);
  await page.getByRole("button", { name: "Place Cash on Delivery order" }).click();
  await expect(page.getByRole("button", { name: "Place Cash on Delivery order" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Review checkout", exact: true })).toBeEnabled();
});
test("mobile checkout reflows and retains accessible controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await expect(page.getByRole("button", { name: "Place Cash on Delivery order" })).toBeEnabled();
  await page.getByLabel("City", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Province / territory", { exact: true })).toBeFocused();
});
test("checkout applies discounts with the delivery address and asks for a fresh review", async ({
  page,
}) => {
  let submitted: Record<string, unknown> | null = null;
  await page.route("**/api/checkout/discount", async (route) => {
    submitted = route.request().postDataJSON();
    const response = await page.request.get("/api/commerce");
    const { cart } = await response.json();
    await route.fulfill({
      json: {
        cart,
        revision: "b".repeat(64),
        quoted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 300000).toISOString(),
        delivery: {
          name: "Standard",
          zone: "Pakistan",
          surcharge_pkr: 0,
          cod_min_pkr: 0,
          cod_max_pkr: null,
        },
        needs_stock_revalidation: false,
        contains_test_product: false,
      },
    });
  });
  await setup(page);
  await page.getByLabel("Discount code", { exact: true }).fill("CITY");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    page.getByText("Discount updated. Review checkout again.", { exact: true }),
  ).toBeVisible();
  expect(submitted).toMatchObject({ code: "CITY", address: { city: "Lahore", country: "PK" } });
  await expect(page.getByRole("button", { name: "Place Cash on Delivery order" })).toBeDisabled();
});
