import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const hasNoOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(hasNoOverflow).toBe(true);
}

test("storefront shell exposes real navigation and accessible overlays", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("link", { name: "House of Lume home" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Shopping bag" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Customer account" })).toBeVisible();

  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search House of Lume" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("mobile navigation manages focus and remains inside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Open navigation" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const interactive = dialog.getByRole("link");
  const count = await interactive.count();
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  for (let index = 0; index < count; index += 1) {
    const element = interactive.nth(index);
    const box = await element.boundingBox();
    expect(box).not.toBeNull();
    if (!box) continue;
    expect(box.y).toBeGreaterThanOrEqual(-1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewportHeight + 1);
  }

  await expectNoHorizontalOverflow(page);
});

test("home categories render the Explore the House composition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#categories");

  const categoriesSection = page.locator("#categories");
  await expect(categoriesSection).toBeVisible();
  await expect(
    categoriesSection.getByRole("heading", { name: "Explore the House", exact: true }),
  ).toBeVisible();
  await expect(
    categoriesSection.getByRole("heading", { name: "A More Beautiful Home", exact: true }),
  ).toBeVisible();

  for (const category of ["Lighting", "Plants", "Objects", "Planters", "Décor"]) {
    await expect(
      categoriesSection.getByRole("heading", { name: category, exact: true }),
    ).toBeVisible();
  }

  await expectNoHorizontalOverflow(page);
});

test("category scene keeps a compact responsive visual hierarchy", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const width of [320, 768, 1024] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#categories");

    const section = page.locator("#categories");
    const title = section.getByRole("heading", { name: "Explore the House", exact: true });
    const feature = section.getByLabel("House of Lume collection");

    await expect(section).toBeVisible();
    await expect(title).toBeVisible();
    await expect(feature).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test("design-system interactions remain keyboard-complete", async ({ page }) => {
  await page.goto("/system");

  await expect(page.getByRole("heading", { name: "House of Lume System" })).toBeVisible();

  const openDialog = page.getByRole("button", { name: "Open dialog" });
  await openDialog.focus();
  await openDialog.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  const tabs = page.getByRole("tablist", { name: "Material story" });
  await expect(tabs).toBeVisible();
  await tabs.getByRole("tab").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab").nth(1)).toBeFocused();
});

test("primary store routes avoid horizontal overflow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const viewport of [
    { width: 320, height: 812 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 900 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ["/", "/system", "/account", "/crm"]) {
      await page.goto(route);
      await expectNoHorizontalOverflow(page);
    }
  }
});
