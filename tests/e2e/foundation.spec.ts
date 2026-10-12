import { expect, test } from "@playwright/test";

const responsiveWidths = [320, 375, 430, 768, 1024, 1440, 1920] as const;

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const hasNoOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(hasNoOverflow).toBe(true);
}

test("storefront hero and shell render", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("region", { name: "House of Lume introduction" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Refined living starts here." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Shop now/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause hero autoplay" })).toBeVisible();
});

test("short mobile hero keeps copy, actions and controls inside the viewport", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 608 });
  await page.goto("/");

  await page
    .getByRole("button", { name: "Show slide 5: A warmer atmosphere, after sunset." })
    .click();

  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const heading = page.getByRole("heading", { name: "A warmer atmosphere, after sunset." });
  const primary = page.getByRole("link", { name: /Shop lighting/ });
  const secondary = page.getByRole("link", { name: /Explore the house/ });
  const pause = page.getByRole("button", { name: "Pause hero autoplay" });
  const next = page.getByRole("button", { name: "Next hero slide" });

  for (const element of [heading, primary, secondary, pause, next]) {
    await expect(element).toBeVisible();
    const box = await element.boundingBox();
    expect(box).not.toBeNull();
    if (!box) continue;
    expect(box.y).toBeGreaterThanOrEqual(-1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewportHeight + 1);
  }

  await expectNoHorizontalOverflow(page);
});

test("home categories render the Explore the House composition", async ({ page }) => {
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

    const [sectionBox, titleBox, featureBox] = await Promise.all([
      section.boundingBox(),
      title.boundingBox(),
      feature.boundingBox(),
    ]);

    expect(sectionBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(featureBox).not.toBeNull();

    if (!sectionBox || !titleBox || !featureBox) continue;

    expect(featureBox.y).toBeGreaterThan(titleBox.y + titleBox.height);
    expect(featureBox.y - (titleBox.y + titleBox.height)).toBeLessThan(220);
    expect(featureBox.width).toBeLessThanOrEqual(width * 0.82);

    const articleFor = (name: string) =>
      section.getByRole("heading", { name, exact: true }).locator("xpath=ancestor::article[1]");

    const [lighting, decor, plants, planters, objects] = await Promise.all([
      articleFor("Lighting").boundingBox(),
      articleFor("Décor").boundingBox(),
      articleFor("Plants").boundingBox(),
      articleFor("Planters").boundingBox(),
      articleFor("Objects").boundingBox(),
    ]);

    for (const box of [lighting, decor, plants, planters, objects]) {
      expect(box).not.toBeNull();
      if (!box) continue;
      expect(box.x).toBeGreaterThanOrEqual(sectionBox.x - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(sectionBox.x + sectionBox.width + 1);
    }

    if (lighting && decor && plants && planters && objects) {
      expect(Math.abs(lighting.y - decor.y)).toBeLessThan(28);
      expect(Math.abs(plants.y - planters.y)).toBeLessThan(28);
      expect(plants.y).toBeGreaterThan(lighting.y + lighting.height - 20);
      expect(objects.y).toBeGreaterThan(plants.y + plants.height - 20);
    }

    await expectNoHorizontalOverflow(page);
  }
});

test("hero slider supports explicit controls without losing accessible content", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Pause hero autoplay" }).click();
  await page
    .getByRole("button", { name: "Show slide 2: Made for the moments that bring us together." })
    .click();

  await expect(
    page.getByRole("heading", { name: "Made for the moments that bring us together." }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Previous hero slide" }).click();
  await expect(page.getByRole("heading", { name: "Refined living starts here." })).toBeVisible();
});

test("search and bag use accessible modal planes and restore focus", async ({ page }) => {
  await page.goto("/");

  const searchTrigger = page.getByRole("button", { name: "Search" });
  await searchTrigger.click();
  await expect(
    page.getByRole("dialog", { name: "Find an object by mood, room, or material." }),
  ).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search House of Lume" })).toBeFocused();
  await page
    .getByRole("button", { name: "Close Find an object by mood, room, or material." })
    .click();
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
  await expect(menuDialog.getByRole("link", { name: /Lighting/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("storefront and design-system showroom do not overflow supported responsive widths", async ({
  page,
}) => {
  for (const width of responsiveWidths) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });

    await page.goto("/");
    await expectNoHorizontalOverflow(page);

    await page.goto("/system");
    await expectNoHorizontalOverflow(page);
  }
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

test("reduced motion keeps the design system usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/system");

  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(
    page.getByRole("heading", { name: "Scroll moves the story, not the interface." }),
  ).toBeVisible();
});

test("hero respects reduced-motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.getByRole("button", { name: "Pause hero autoplay" })).toBeDisabled();
  await page
    .getByRole("button", { name: "Show slide 5: A warmer atmosphere, after sunset." })
    .click();
  await expect(
    page.getByRole("heading", { name: "A warmer atmosphere, after sunset." }),
  ).toBeVisible();
});

test("account and CRM foundation routes load", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Account foundation." })).toBeVisible();

  await page.goto("/crm");
  await expect(page.getByRole("heading", { name: "CRM foundation." })).toBeVisible();
});
