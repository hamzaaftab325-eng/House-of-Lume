import { expect, test } from "@playwright/test";
const orderId = "94000000-0000-4000-8000-000000000001";
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "dwellune-test-admin", value: "1", url: "http://127.0.0.1:3000" },
  ]);
});
test("manual review blocks confirmation until staff clear it with a note", async ({ page }) => {
  await page.goto(`/crm/verification/${orderId}`);
  await page.getByLabel("Action", { exact: true }).selectOption("request_review");
  await page
    .getByLabel("Admin verification note")
    .fill("Address needs to be checked with customer.");
  await page.getByLabel("I reviewed the order and confirm this decision.").check();
  await page.getByRole("button", { name: "Save verification action" }).click();
  await expect(page.getByText("Attempt 1 · request review", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Action", { exact: true }).locator('option[value="confirm"]'),
  ).toHaveCount(0);
  await page.goto("/crm/verification?filter=review");
  await expect(page.getByRole("link", { name: "Order #900001", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Order #900001", exact: true }).click();
  await page.getByLabel("Action", { exact: true }).selectOption("clear_review");
  await page
    .getByLabel("Admin verification note")
    .fill("Customer confirmed the complete delivery address.");
  await page.getByLabel("I reviewed the order and confirm this decision.").check();
  await page.getByRole("button", { name: "Save verification action" }).click();
  await expect(page.getByText("Attempt 2 · clear review", { exact: true })).toBeVisible();
  await expect(page.getByText("Cleared by", { exact: false })).toBeVisible();
  await page.getByLabel("Action", { exact: true }).selectOption("confirm");
  await page
    .getByLabel("Admin verification note")
    .fill("Verified after the separate manual review clearance.");
  await page.getByLabel("I reviewed the order and confirm this decision.").check();
  await page.getByRole("button", { name: "Save verification action" }).click();
  await expect(page.getByText("Attempt 3 · confirm", { exact: true })).toBeVisible();
});
test("saves bounded rules without opening checkout", async ({ page }) => {
  await page.goto("/crm/verification/settings");
  await page.getByLabel("High-value threshold (PKR)").fill("30000");
  await page
    .getByLabel("Reason for changing rules")
    .fill("Adjust threshold after merchant review.");
  await page.getByLabel("I reviewed these rules and limits.").check();
  await page.getByRole("button", { name: "Save verification rules" }).click();
  await expect(page.getByLabel("High-value threshold (PKR)")).toHaveValue("30000");
  await expect(page.getByLabel("Reason for changing rules")).toHaveValue("");
  const result = await page.request.get("/api/admin/verification-policy");
  expect(result.status()).toBe(200);
  expect(await result.json()).toMatchObject({ revision: 1, highValuePkr: 30000 });
  await expect(
    page.getByText("Saving these rules does not open checkout.", { exact: false }),
  ).toBeVisible();
});
test("uncertain policy writes retry the same frozen request", async ({ page }) => {
  const bodies: string[] = [];
  await page.route("**/api/admin/verification-policy", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    bodies.push(route.request().postData() ?? "");
    if (bodies.length === 1)
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unknown result" }),
      });
    await route.continue();
  });
  await page.goto("/crm/verification/settings");
  await page.getByLabel("Reason for changing rules").fill("Keep current rules following review.");
  await page.getByLabel("I reviewed these rules and limits.").check();
  await page.getByRole("button", { name: "Save verification rules" }).click();
  await expect(page.getByLabel("High-value threshold (PKR)")).toBeDisabled();
  await page.getByRole("button", { name: "Retry same rule-change attempt" }).click();
  await expect(page.getByLabel("Reason for changing rules")).toHaveValue("");
  expect(bodies).toHaveLength(2);
  expect(bodies[1]).toBe(bodies[0]);
});
test("stale rules require reload", async ({ page }) => {
  await page.route("**/api/admin/verification-policy", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({ error: "Rules changed. Reload." }),
        })
      : route.continue(),
  );
  await page.goto("/crm/verification/settings");
  await page.getByLabel("Reason for changing rules").fill("Review before changing policy.");
  await page.getByLabel("I reviewed these rules and limits.").check();
  await page.getByRole("button", { name: "Save verification rules" }).click();
  await expect(page.getByRole("button", { name: "Reload rules" })).toBeVisible();
  await expect(page.getByLabel("Reason for changing rules")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Retry same rule-change attempt" })).toHaveCount(0);
});
test("policy API and page deny visitors", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  expect((await page.request.get("/api/admin/verification-policy")).status()).toBe(401);
  await page.goto("/crm/verification/settings");
  await expect(page).toHaveURL(/\/auth\/signin/);
  await context.close();
});
for (const width of [375, 768, 1440])
  test(`rule settings reflow and keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/crm/verification/settings");
    await expect(page.getByRole("heading", { name: "COD verification rules." })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.bringToFront();
    await page.getByLabel("High-value threshold (PKR)").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Possible duplicate window (hours)")).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    if (width !== 768)
      await page.screenshot({ path: `../phase9-rules-${width}.png`, fullPage: true });
  });
