import { expect, test } from "@playwright/test";

test("storefront foundation renders and routes correctly", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Objects for a warmer home." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Customer account" })).toHaveAttribute(
    "href",
    "/account",
  );
  await expect(page.getByRole("link", { name: "Commerce CRM" })).toHaveAttribute("href", "/crm");
});

test("account and CRM foundation routes load", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Account foundation." })).toBeVisible();

  await page.goto("/crm");
  await expect(page.getByRole("heading", { name: "CRM foundation." })).toBeVisible();
});
