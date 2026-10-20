import { expect, test } from "@playwright/test";
import type { BrowserContext } from "@playwright/test";
async function owner(context: BrowserContext) {
  await context.addCookies([
    { name: "dwellune-test-admin", value: "1", url: "http://127.0.0.1:3000" },
  ]);
}
for (const width of [320, 375, 768, 1024, 1280, 1440, 1920]) {
  test(`owner overview reflows and navigation works at ${width}px`, async ({ page, context }) => {
    await owner(context);
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/crm");
    await expect(page.getByRole("heading", { name: "Store overview", exact: true })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("link", { name: "#900001", exact: true })).toBeVisible();
    if (width >= 1024)
      await expect(
        page.getByText("owner-fixture@example.invalid", { exact: true }).first(),
      ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width < 1024) {
      const trigger = page.getByRole("button", { name: "Open admin navigation" });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Admin navigation" });
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('[aria-current="page"]')).toHaveText("Overview");
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await dialog.getByRole("link", { name: "Verification rules", exact: true }).click();
      await expect(dialog).not.toBeVisible();
    } else {
      const navigation = page.getByRole("navigation", { name: "Administrator navigation" });
      await expect(navigation.locator('[aria-current="page"]')).toHaveText("Overview");
      await navigation.getByRole("link", { name: "Verification rules", exact: true }).click();
    }
    await expect(page.getByRole("heading", { name: "COD verification rules." })).toBeVisible();
    if (width >= 1024)
      await expect(
        page
          .getByRole("navigation", { name: "Administrator navigation" })
          .locator('[aria-current="page"]'),
      ).toHaveText("Verification rules");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
    if (width === 375 || width === 1440) {
      await page.goto("/crm");
      await expect(
        page.getByRole("heading", { name: "Store overview", exact: true }),
      ).toBeVisible();
      await page.screenshot({ path: `../phase12-evidence/overview-${width}.png`, fullPage: true });
    }
  });
}
test("nested order and delivery destinations have one correct active label", async ({
  page,
  context,
}) => {
  await owner(context);
  for (const [path, label] of [
    ["/crm/verification/94000000-0000-4000-8000-000000000001", "COD verification"],
    ["/crm/notifications/delivery", "Delivery status"],
    ["/crm/notifications", "Notifications"],
  ]) {
    await page.goto(path);
    const current = page
      .getByRole("navigation", { name: "Administrator navigation" })
      .locator('[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText(label);
  }
});
test("overview shows a truthful empty queue and no sample metrics", async ({ page, context }) => {
  await owner(context);
  await context.addCookies([
    {
      name: "dwellune-test-verification",
      value: JSON.stringify({
        revision: 1,
        status: "confirmed",
        verification: "admin_approved",
        notes: [],
      }),
      url: "http://127.0.0.1:3000",
    },
  ]);
  await page.goto("/crm");
  await expect(
    page.getByRole("heading", { name: "No requests awaiting verification" }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByText(/1,248,600|312,400|Sample data/)).toHaveCount(0);
  await page.getByRole("link", { name: "View all verification orders" }).click();
  await expect(page.getByRole("link", { name: "Order #900001", exact: true })).toBeVisible();
});
test("skip link reaches the content and menu closes across desktop breakpoint", async ({
  page,
  context,
}) => {
  await owner(context);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/crm");
  await page.getByRole("heading", { name: "Store overview", exact: true }).waitFor();
  await page.waitForLoadState("networkidle");
  await page.bringToFront();
  await page.getByRole("link", { name: "Skip to main content" }).focus();
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#crm-main")).toBeFocused();
  await page.getByRole("button", { name: "Open admin navigation" }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("link", { name: "DWELLUNE admin overview" })).toBeVisible();
});
test("session uncertainty hides private overview and retry restores it", async ({
  page,
  context,
}) => {
  await owner(context);
  let unavailable = true;
  await page.route("**/api/admin/session", (route) =>
    unavailable
      ? route.fulfill({ status: 503, contentType: "application/json", body: "{}" })
      : route.continue(),
  );
  await page.goto("/crm");
  await expect(page.getByRole("button", { name: "Retry session check" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Store overview", exact: true }),
  ).not.toBeVisible();
  unavailable = false;
  await page.getByRole("button", { name: "Retry session check" }).click();
  await expect(page.getByRole("heading", { name: "Store overview", exact: true })).toBeVisible();
});
test("customer identity cannot open the owner overview", async ({ page, context, request }) => {
  await context.addCookies([
    { name: "dwellune-test-customer", value: "1", url: "http://127.0.0.1:3000" },
  ]);
  await page.goto("/crm");
  await expect(page).toHaveURL(/\/auth\/signin/);
  await expect(page.getByRole("heading", { name: "Store overview", exact: true })).toHaveCount(0);
  expect((await request.get("/api/admin/session")).status()).toBe(401);
});

test("mobile dialog traps focus and closes when the owner session becomes uncertain", async ({
  page,
  context,
}) => {
  await owner(context);
  await page.setViewportSize({ width: 375, height: 900 });
  let unavailable = false;
  await page.route("**/api/admin/session", (route) =>
    unavailable
      ? route.fulfill({ status: 503, contentType: "application/json", body: "{}" })
      : route.continue(),
  );
  await page.goto("/crm");
  await page.getByRole("button", { name: "Open admin navigation" }).click();
  const dialog = page.getByRole("dialog", { name: "Admin navigation" });
  await expect(dialog).toBeVisible();
  await page.bringToFront();
  await dialog.getByRole("button", { name: "Close admin navigation" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Sign out of all sessions" })).toBeFocused();
  unavailable = true;
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByRole("button", { name: "Retry session check" })).toBeVisible();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("#crm-navigation")).not.toHaveAttribute("open", "");
});
