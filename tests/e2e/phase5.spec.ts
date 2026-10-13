import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const hasNoOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(hasNoOverflow).toBe(true);
}

test.describe("Phase 5 product detail experience", () => {
  test("renders product story, commerce policy and structured data", async ({ page }) => {
    await page.goto("/products/test-aurelia-floor-lamp");

    await expect(page.getByRole("heading", { level: 1, name: "Aurelia Floor Lamp" })).toBeVisible();
    await expect(page.getByText(/18,900/).first()).toBeVisible();
    await expect(page.getByText(/Pay when your order arrives/i)).toBeVisible();
    await expect(page.getByText(/Estimated delivery: 2–7 days/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Made to belong in the room." })).toBeVisible();
    await expect(page.getByText("Powder-coated metal, linen shade")).toBeVisible();

    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toHaveCount(1);
    const structuredData = await jsonLd.textContent();
    expect(structuredData).toContain("Aurelia Floor Lamp");
    expect(structuredData).toContain('"@type":"Product"');
    await expectNoHorizontalOverflow(page);
  });

  test("variant selection owns price, stock and URL state", async ({ page }) => {
    await page.goto("/products/test-aurelia-floor-lamp");

    await page.getByRole("button", { name: /Ink Black/ }).click();
    await expect(page).toHaveURL(/variant=TEST-AUR-BLACK-L/);
    await expect(page.getByText(/21,900/).first()).toBeVisible();
    await expect(page.getByText("Currently unavailable").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Currently unavailable" })).toBeDisabled();

    await page.getByRole("button", { name: /Warm Brass/ }).click();
    await expect(page).toHaveURL(/variant=TEST-AUR-BRASS-M/);
    await expect(page.getByText("Low stock").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to Bag" })).toBeEnabled();
  });

  test("quantity, bag and wishlist persist through storefront drawers", async ({ page }) => {
    await page.goto("/products/test-aurelia-floor-lamp");

    await page.getByRole("button", { name: "Increase quantity" }).click();
    await expect(page.getByLabel("Quantity 2")).toHaveText("2");
    await page.getByRole("button", { name: "Add to Bag" }).click();
    await expect(page.getByText("Added to your bag", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Shopping bag" }).click();
    const bag = page.getByRole("dialog", { name: "Shopping bag" });
    await expect(bag).toBeVisible();
    await expect(bag.getByText("Aurelia Floor Lamp")).toBeVisible();
    await expect(bag.getByText("Qty 2")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Saved" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("button", { name: "Wishlist" }).click();
    const wishlist = page.getByRole("dialog", { name: "Wishlist" });
    await expect(wishlist).toBeVisible();
    await expect(wishlist.getByText("Aurelia Floor Lamp")).toBeVisible();
  });

  test("gallery zoom is keyboard-dismissable", async ({ page }) => {
    await page.goto("/products/test-aurelia-floor-lamp");

    const trigger = page.getByRole("button", { name: "Open image zoom" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: /Aurelia Floor Lamp — close view/i });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("recently viewed excludes current product and recalls prior object", async ({ page }) => {
    await page.goto("/products/test-aurelia-floor-lamp");
    await page.waitForFunction(() =>
      window.localStorage
        .getItem("dwellune-recently-viewed-v1")
        ?.includes("test-aurelia-floor-lamp"),
    );
    await page.goto("/products/test-sable-planter");

    const recentHeading = page.getByRole("heading", { name: "Recently viewed" });
    await expect(recentHeading).toBeVisible();
    const recentSection = recentHeading.locator("xpath=ancestor::section[1]");
    await expect(recentSection.getByRole("link", { name: /Aurelia Floor Lamp/ })).toBeVisible();
  });

  test("unknown or unpublished-like slug resolves to not found", async ({ page }) => {
    await page.goto("/products/not-a-published-object");
    await expect(
      page.getByRole("heading", { name: "This page is not in the room." }),
    ).toBeVisible();
  });

  test("product detail reflows without horizontal overflow", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [320, 390, 768, 1024, 1440] as const) {
      await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
      await page.goto("/products/test-aurelia-floor-lamp");
      await expect(
        page.getByRole("heading", { level: 1, name: "Aurelia Floor Lamp" }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });
});
