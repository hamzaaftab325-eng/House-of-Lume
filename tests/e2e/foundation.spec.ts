import { expect, test } from "@playwright/test";

const responsiveWidths = [320, 375, 430, 768, 1024, 1440, 1920] as const;

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const hasNoOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(hasNoOverflow).toBe(true);
}

test("final Phase 3 homepage and storefront shell render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Homes That Inspire" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Curated for a More Beautiful Home" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Design Meets Everyday Living" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Spaces with Soul" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Made to Last" })).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("link", { name: "Shop Collection" })).toHaveAttribute("href", "#categories");
  await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();
});

test("search and bag use accessible modal planes and restore focus", async ({ page }) => {
  await page.goto("/");
  const searchTrigger = page.getByRole("button", { name: "Search" });
  await searchTrigger.click();
  await expect(page.getByRole("dialog", { name: "Find an object by mood, room, or material." })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search House of Lume" })).toBeFocused();
  await page.getByRole("button", { name: "Close Find an object by mood, room, or material." }).click();
  await expect(searchTrigger).toBeFocused();
  const bagTrigger = page.getByRole("button", { name: "Shopping bag" });
  await bagTrigger.click();
  await expect(page.getByRole("dialog", { name: "Shopping bag" })).toBeVisible();
  await expect(page.getByText("Your bag is quiet.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Shopping bag" })).not.toBeVisible();
  await expect(bagTrigger).toBeFocused();
});

test("mobile navigation has accessible targets and scoped navigation", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const menuTrigger = page.getByRole("button", { name: "Open navigation" });
  const searchTrigger = page.getByRole("button", { name: "Search" });
  const bagTrigger = page.getByRole("button", { name: "Shopping bag" });
  for (const control of [menuTrigger, searchTrigger, bagTrigger]) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
  await menuTrigger.click();
  const menuDialog = page.getByRole("dialog", { name: "Explore" });
  await expect(menuDialog).toBeVisible();
  await expect(menuDialog.getByRole("link", { name: "Lamps" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("storefront and design-system showroom do not overflow supported responsive widths", async ({ page }) => {
  for (const width of responsiveWidths) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
    await page.goto("/");
    await expectNoHorizontalOverflow(page);
    await page.goto("/system");
    await expectNoHorizontalOverflow(page);
  }
});

test("homepage respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.getByRole("heading", { name: "Homes That Inspire" })).toBeVisible();
});

test("design system interactions are keyboard usable", async ({ page }) => {
  await page.goto("/system");
  await expect(page.getByRole("heading", { name: "A showroom, not a template." })).toBeVisible();
  const bronzeTab = page.getByRole("tab", { name: "Bronze" });
  await bronzeTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Linen" })).toHaveAttribute("aria-selected", "true");
  const dialogTrigger = page.getByRole("button", { name: "Open dialog" });
  await dialogTrigger.click();
  await expect(page.getByRole("dialog", { name: "A calm interruption." })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialogTrigger).toBeFocused();
});

test("account and CRM foundation routes load", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Account foundation." })).toBeVisible();
  await page.goto("/crm");
  await expect(page.getByRole("heading", { name: "CRM foundation." })).toBeVisible();
});
