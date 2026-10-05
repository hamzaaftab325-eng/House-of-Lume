import { expect, test } from "@playwright/test";

test("storefront shell and Phase 2 product system render", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Objects for a warmer home." })).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByText("Nocturne Reading Lamp")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open component lab" })).toHaveAttribute("href", "/system");
});

test("search and bag use accessible modal planes", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("dialog", { name: "Find an object by mood, room, or material." })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search House of Lume" })).toBeFocused();
  await page.getByRole("button", { name: "Close Find an object by mood, room, or material." }).click();

  await page.getByRole("button", { name: "Shopping bag" }).click();
  await expect(page.getByRole("dialog", { name: "Shopping bag" })).toBeVisible();
  await expect(page.getByText("Your bag is quiet.")).toBeVisible();
});

test("mobile navigation has large accessible targets and no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Explore" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lighting" })).toBeVisible();

  const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(noHorizontalOverflow).toBe(true);
});

test("design system interactions are keyboard usable", async ({ page }) => {
  await page.goto("/system");

  await expect(page.getByRole("heading", { name: "A showroom, not a template." })).toBeVisible();
  const bronzeTab = page.getByRole("tab", { name: "Bronze" });
  await bronzeTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Linen" })).toHaveAttribute("aria-selected", "true");

  await page.getByRole("button", { name: "Open dialog" }).click();
  await expect(page.getByRole("dialog", { name: "A calm interruption." })).toBeVisible();
});

test("reduced motion keeps the design system usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/system");

  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.getByRole("heading", { name: "Scroll moves the story, not the interface." })).toBeVisible();
});

test("account and CRM foundation routes load", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Account foundation." })).toBeVisible();

  await page.goto("/crm");
  await expect(page.getByRole("heading", { name: "CRM foundation." })).toBeVisible();
});
