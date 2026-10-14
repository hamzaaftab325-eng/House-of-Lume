import { expect, test } from "@playwright/test";
const orderId = "94000000-0000-4000-8000-000000000001";
test("a double click creates only one verification request", async ({ page, context }) => {
  await staff(context);
  let count = 0;
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = () => resolve();
  });
  await page.route("**/api/admin/verification", async (route) => {
    count++;
    await held;
    await route.continue();
  });
  await page.goto(`/crm/verification/${orderId}`);
  await page
    .getByLabel("Staff verification note")
    .fill("No response on the actual contact attempt.");
  const save = page.getByRole("button", { name: "Save verification action" });
  await save.dblclick();
  await expect(page.getByRole("button", { name: "Saving…", exact: true })).toBeDisabled();
  await expect.poll(() => count).toBe(1);
  release();
  await expect(page.getByText("Attempt 1 · contact", { exact: true })).toBeVisible();
  expect(count).toBe(1);
});
async function staff(context: import("@playwright/test").BrowserContext) {
  await context.addCookies([
    { name: "dwellune-test-staff", value: "1", url: "http://127.0.0.1:3000" },
  ]);
}
test("verification workspace and API deny visitors and foreign-origin actions", async ({
  page,
  request,
}) => {
  await page.goto("/crm/verification");
  await expect(page).toHaveURL(/\/auth\/signin/);
  expect((await request.get("/api/admin/session")).status()).toBe(401);
  expect(
    (
      await request.post("/api/admin/verification", {
        headers: { Origin: "https://evil.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  const response = await request.post("/api/admin/verification", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: {
      orderId,
      requestId: "94000000-0000-4000-8000-000000000099",
      input: { action: "confirm", expectedRevision: 0, note: "Customer verified" },
    },
  });
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
});
for (const width of [375, 768, 1440])
  test(`staff queue and order reflow at ${width}px`, async ({ page, context }) => {
    await staff(context);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/crm/verification");
    await expect(page.getByRole("heading", { name: "Verification queue." })).toBeVisible();
    await page.getByRole("link", { name: "Order #900001", exact: true }).click();
    await expect(page.getByLabel("Staff verification note")).toBeVisible();
    await expect(page.getByRole("link", { name: "Call customer" })).toHaveAttribute(
      "href",
      "tel:+923001234567",
    );
    await page.getByLabel("Action", { exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Contact method", { exact: true })).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    if (width === 375 || width === 1440)
      await page.screenshot({ path: `../phase9-order-${width}.png`, fullPage: true });
  });
test("records manual contact, confirms with staff/time and cancels before dispatch", async ({
  page,
  context,
}) => {
  await staff(context);
  await page.goto(`/crm/verification/${orderId}`);
  await page.getByLabel("Contact outcome", { exact: true }).selectOption("reached");
  await page
    .getByLabel("Staff verification note")
    .fill("Customer reached by phone and address checked.");
  await page.getByRole("button", { name: "Save verification action" }).click();
  await expect(page.getByText("Attempt 1 · contact", { exact: true })).toBeVisible();
  await page.getByLabel("Action", { exact: true }).selectOption("confirm");
  await page
    .getByLabel("Staff verification note")
    .fill("Confirmed the customer and delivery details.");
  await page.getByLabel("I reviewed the order and confirm this decision.").check();
  await page.getByRole("button", { name: "Save verification action" }).click();
  await expect(
    page.getByText("Fixture staff · Verified by Fixture staff", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Action", { exact: true })).toHaveValue("cancel");
  await page
    .getByLabel("Staff verification note")
    .fill("Customer requested cancellation before dispatch.");
  await page.getByLabel("I reviewed the order and confirm this decision.").check();
  await page.getByRole("button", { name: "Save verification action" }).click();
  await expect(
    page.getByText("This order is closed or beyond the verification cancellation workflow.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByText("Attempt 3 · cancel", { exact: true })).toBeVisible();
});
test("rejects a pending order only after explicit review and keeps its history", async ({
  page,
  context,
}) => {
  await staff(context);
  await page.goto(`/crm/verification/${orderId}`);
  await page.getByLabel("Action", { exact: true }).selectOption("reject");
  await page
    .getByLabel("Staff verification note")
    .fill("Customer declined the order during verification.");
  await page.getByLabel("I reviewed the order and confirm this decision.").check();
  await page.getByRole("button", { name: "Save verification action" }).click();
  await expect(page.getByText("Attempt 1 · reject", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save verification action" })).toHaveCount(0);
});
test("retries uncertain results with the same immutable payload and request ID", async ({
  page,
  context,
}) => {
  await staff(context);
  const requests: string[] = [];
  await page.route("**/api/admin/verification", async (route) => {
    requests.push(route.request().postData() ?? "");
    if (requests.length === 1)
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unknown result" }),
      });
    else await route.continue();
  });
  await page.goto(`/crm/verification/${orderId}`);
  await page
    .getByLabel("Staff verification note")
    .fill("No response on the first actual phone attempt.");
  await page.getByRole("button", { name: "Save verification action" }).click();
  await expect(page.getByLabel("Staff verification note")).toBeDisabled();
  await page.getByRole("button", { name: "Retry same action attempt" }).click();
  await expect(page.getByText("Attempt 1 · contact", { exact: true })).toBeVisible();
  expect(requests.length).toBe(2);
  expect(requests[1]).toBe(requests[0]);
});
test("stale order conflicts require a reload instead of silently submitting again", async ({
  page,
  context,
}) => {
  await staff(context);
  let count = 0;
  await page.route("**/api/admin/verification", (route) => {
    count++;
    return route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Another action changed this order. Reload its details before continuing.",
      }),
    });
  });
  await page.goto(`/crm/verification/${orderId}`);
  await page.getByLabel("Staff verification note").fill("Customer did not respond.");
  await page.getByRole("button", { name: "Save verification action" }).click();
  await expect(page.getByRole("button", { name: "Reload order details" })).toBeVisible();
  await expect(page.getByLabel("Staff verification note")).toBeDisabled();
  expect(count).toBe(1);
});
test("hides private order details when staff access is revoked in another tab", async ({
  page,
  context,
}) => {
  await staff(context);
  await page.goto(`/crm/verification/${orderId}`);
  await expect(page.getByRole("heading", { name: "Order #900001" })).toBeVisible();
  await page.route("**/api/admin/session", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ error: "Access revoked" }),
    }),
  );
  await page.evaluate(() =>
    window.dispatchEvent(new StorageEvent("storage", { key: "dwellune-auth-change" })),
  );
  await expect(page.getByRole("heading", { name: "Order #900001" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Retry session check" })).toBeVisible();
});
