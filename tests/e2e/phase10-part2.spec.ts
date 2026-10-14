import { expect, test } from "@playwright/test";
async function login(context: import("@playwright/test").BrowserContext, staff = false) {
  await context.addCookies([
    {
      name: staff ? "dwellune-test-staff" : "dwellune-test-customer",
      value: "1",
      url: "http://127.0.0.1:3000",
    },
  ]);
}
test("saves optional preferences while essential notices remain enabled", async ({
  page,
  context,
}) => {
  await login(context);
  await page.goto("/account/notifications/preferences");
  await page.getByLabel("Product updates in my notification inbox").check();
  await page.getByRole("button", { name: "Save notification preferences", exact: true }).click();
  await expect(page.getByText("Notification preferences saved.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Product updates in my notification inbox")).toBeChecked();
  await expect(
    page.getByText("Essential order, verification and account updates remain enabled.", {
      exact: false,
    }),
  ).toBeVisible();
});
test("uncertain preference writes retry frozen choices", async ({ page, context }) => {
  await login(context);
  const bodies: string[] = [];
  await page.route("**/api/notifications/preferences", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    bodies.push(route.request().postData() ?? "");
    if (bodies.length === 1)
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"error":"Unknown"}',
      });
    await route.continue();
  });
  await page.goto("/account/notifications/preferences");
  await page.getByLabel("Allow marketing emails").check();
  await page.getByRole("button", { name: "Save notification preferences", exact: true }).click();
  await expect(page.getByLabel("Allow marketing emails")).toBeDisabled();
  await page.getByRole("button", { name: "Retry same preferences" }).click();
  await expect(page.getByText("Notification preferences saved.", { exact: true })).toBeVisible();
  expect(bodies).toHaveLength(2);
  expect(bodies[0]).toBe(bodies[1]);
});
test("staff sees real delivery semantics and deferred registry dependencies", async ({
  page,
  context,
}) => {
  await login(context, true);
  await page.goto("/crm/notifications/delivery");
  await expect(page.getByRole("heading", { name: "Notification delivery." })).toBeVisible();
  await expect(
    page.getByText(
      "Acceptance uncertain — inspect the sender mailbox; automatic resend is blocked.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Waiting for: Product subscription workflow", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Sent", exact: true }).click();
  await expect(page.getByText("No email jobs in this view.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /resend/i })).toHaveCount(0);
});
test("preferences and operations require the right sessions", async ({ page, request }) => {
  expect((await request.get("/api/notifications/preferences")).status()).toBe(401);
  expect((await request.get("/api/admin/notification-operations")).status()).toBe(401);
  await page.goto("/account/notifications/preferences");
  await expect(page).toHaveURL(/auth\/signin/);
  await page.goto("/crm/notifications/delivery");
  await expect(page).toHaveURL(/auth\/signin/);
});
for (const width of [375, 768, 1440])
  test(`delivery operations reflow at ${width}`, async ({ page, context }) => {
    await login(context, true);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/crm/notifications/delivery");
    await expect(page.getByRole("heading", { name: "Notification delivery." })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    if (width !== 768)
      await page.screenshot({ path: `../phase10-part2-delivery-${width}.png`, fullPage: false });
  });
