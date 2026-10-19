import { expect, test } from "@playwright/test";
async function identity(
  context: import("@playwright/test").BrowserContext,
  audience: "customer" | "staff",
) {
  await context.addCookies([
    {
      name: audience === "staff" ? "dwellune-test-admin" : "dwellune-test-customer",
      value: "1",
      url: "http://127.0.0.1:3000",
    },
  ]);
}
test("dedicated customer notifications retain legacy filters and settings links", async ({
  page,
  context,
}) => {
  await identity(context, "customer");
  await page.goto("/account/notifications?filter=unread&page=2");
  await expect(page.getByRole("heading", { name: "Your notifications." })).toBeVisible();
  await expect(page.getByLabel("Show", { exact: true })).toHaveValue("unread");
  await expect(page.getByRole("article")).toHaveCount(20);
  await page.goto("/account/notifications?filter=orders");
  await expect(page.getByLabel("Category", { exact: true })).toHaveValue("orders");
  await page.getByRole("link", { name: "Notification settings", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/notifications\/preferences$/);
  await expect(page.getByRole("heading", { name: "Notification settings." })).toBeVisible();
});

for (const audience of ["customer", "staff"] as const)
  test(`${audience} inbox filters, paginates and reads without mixing audiences`, async ({
    page,
    context,
  }) => {
    await identity(context, audience);
    const inboxLabel = audience === "staff" ? "admin" : "customer";
    const path = audience === "staff" ? "/crm/notifications" : "/account/notifications";
    await page.goto(path);
    await expect(
      page.getByText(`23 unread in your ${inboxLabel} inbox`, { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(20);
    await page.getByRole("link", { name: "Older notifications", exact: true }).click();
    await expect(page.getByRole("article")).toHaveCount(3);
    await page.getByRole("link", { name: "Newest notifications", exact: true }).click();
    await page
      .getByRole("button", {
        name:
          audience === "staff"
            ? "Mark Operational update 23 as read"
            : "Mark Account update 23 as read",
        exact: true,
      })
      .click();
    await expect(
      page.getByText(`22 unread in your ${inboxLabel} inbox`, { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Show", { exact: true }).selectOption("unread");
    await page.getByLabel("Category", { exact: true }).selectOption("verification");
    await page.getByRole("button", { name: "Apply filters", exact: true }).click();
    await expect(page.getByRole("article")).toHaveCount(1);
    await page.getByRole("button", { name: "Mark all as read", exact: true }).click();
    await expect(
      page.getByText(`0 unread in your ${inboxLabel} inbox`, { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
    if (audience === "staff")
      await expect(
        page.getByRole("link", { name: "Admin notifications, 0 unread", exact: true }),
      ).toBeVisible();
  });
test("notification API and pages protect both audiences", async ({ page, request }) => {
  for (const audience of ["customer", "staff"]) {
    expect((await request.get(`/api/notifications?audience=${audience}`)).status()).toBe(401);
    await page.goto(audience === "staff" ? "/crm/notifications" : "/account/notifications");
    await expect(page).toHaveURL(/\/auth\/signin/);
  }
  expect(
    (
      await request.post("/api/notifications", {
        headers: { Origin: "https://evil.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
});
test("uncertain read-all retries preserve the original cutoff", async ({ page, context }) => {
  await identity(context, "staff");
  const bodies: string[] = [];
  await page.route("**/api/notifications", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    bodies.push(route.request().postData() ?? "");
    if (bodies.length === 1)
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"error":"Unavailable"}',
      });
    await route.continue();
  });
  await page.goto("/crm/notifications");
  await page.getByRole("button", { name: "Mark all as read", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mark all as read", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Retry read update" }).click();
  await expect(page.getByText("0 unread in your admin inbox", { exact: true })).toBeVisible();
  expect(bodies).toHaveLength(2);
  expect(bodies[0]).toBe(bodies[1]);
});
test("notification center hides private data after access revocation", async ({
  page,
  context,
}) => {
  await identity(context, "staff");
  await page.goto("/crm/notifications");
  await page.route("**/api/admin/session", (route) =>
    route.fulfill({ status: 403, contentType: "application/json", body: '{"error":"revoked"}' }),
  );
  await page.evaluate(() =>
    window.dispatchEvent(new StorageEvent("storage", { key: "dwellune-auth-change" })),
  );
  await expect(page.getByRole("heading", { name: "Admin notifications." })).not.toBeVisible();
});
for (const width of [375, 768, 1440])
  test(`notification center keyboard and reflow at ${width}`, async ({ page, context }) => {
    await identity(context, "staff");
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/crm/notifications");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Show", { exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Category", { exact: true })).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    if (width !== 768)
      await page.screenshot({ path: `../phase10-notifications-${width}.png`, fullPage: true });
  });

test("customer header badge refreshes its count on mobile", async ({ page, context }) => {
  await identity(context, "customer");
  await page.route("**/api/commerce**", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const r = await route.fetch();
    const data = await r.json();
    if (data.cart) data.cart.authenticated = true;
    await route.fulfill({ response: r, json: data });
  });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/account/notifications");
  await expect(
    page.getByRole("link", { name: "Notifications, 23 unread", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Mark all as read", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Notifications, 0 unread", exact: true }),
  ).toBeVisible();
});
