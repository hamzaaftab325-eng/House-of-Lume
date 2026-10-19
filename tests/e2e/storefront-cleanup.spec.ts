import { expect, test } from "@playwright/test";

test("development showcase is absent from the public site", async ({ page }) => {
  const response = await page.goto("/system");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "A showroom, not a template." })).toHaveCount(0);
});

test("homepage has a working closing shop action without signup or journal previews", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByLabel("Newsletter preview")).toHaveCount(0);
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "House Notes", exact: true })).toHaveCount(0);
  const closing = page.getByRole("region", { name: "A More Beautiful Tomorrow" });
  await closing.scrollIntoViewIfNeeded();
  const action = closing.getByRole("link", { name: "Explore the collection" });
  await expect(action).toBeVisible();
  await expect(action).toHaveAttribute("href", "/shop");
  await closing.screenshot({ path: "../part3-evidence/closing-desktop.png" });
  const missingAnchors = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"],a[href^="/#"]'))
      .filter((a) => a.hash && !document.getElementById(decodeURIComponent(a.hash.slice(1))))
      .map((a) => a.getAttribute("href")),
  );
  expect(missingAnchors).toEqual([]);
  await action.click();
  await expect(page).toHaveURL(/\/shop$/);
});

test("product retains offers and purchase options without optional ratings", async ({ page }) => {
  await page.goto("/products/test-aurelia-floor-lamp");
  await expect(page.getByRole("heading", { level: 1, name: "Aurelia Floor Lamp" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to Bag" })).toBeEnabled();
  await expect(page.getByText("No reviews yet", { exact: true })).toHaveCount(0);
  const data = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
  );
  expect(data["@type"]).toBe("Product");
  expect(data.offers.length).toBeGreaterThan(0);
  expect(data.offers[0].priceCurrency).toBe("PKR");
  expect(data.aggregateRating).toBeUndefined();
});
