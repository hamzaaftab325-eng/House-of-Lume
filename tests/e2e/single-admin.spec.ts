import { expect, test } from "@playwright/test";

test("owner workspace uses the admin session without a customer fixture", async ({
  page,
  context,
  request,
}) => {
  await context.addCookies([
    { name: "dwellune-test-admin", value: "1", url: "http://127.0.0.1:3000" },
  ]);
  await page.goto("/crm/verification");
  await expect(page.getByRole("heading", { name: "Verification queue." })).toBeVisible();
  const response = await context.request.get("/api/admin/session");
  expect(response.status()).toBe(200);
  const session = await response.json();
  expect(session.userId).toBeTruthy();
  expect(session.customerId).toBeUndefined();
  expect((await request.get("/api/admin/session")).status()).toBe(401);
  await page.goto("/crm/notifications");
  await expect(page.getByRole("heading", { name: "Admin notifications." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry session check" })).toHaveCount(0);
});
