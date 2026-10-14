import { expect, test } from "@playwright/test";

test.describe("Phase 7 public access and security", () => {
  test("private account redirects visitors to accessible sign-in", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/auth\/signin\?next=/);
    await expect(page.getByRole("heading", { name: "Welcome home." })).toBeVisible();
    await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
  test("unconfigured email flows are honest and disabled", async ({ page }) => {
    for (const route of ["reset"]) {
      await page.goto(`/auth/${route}`);
      await expect(
        page.getByText("Account email delivery is being prepared.", { exact: false }),
      ).toBeVisible();
      await expect(page.getByRole("main").locator('button[type="submit"]')).toBeDisabled();
    }
  });
  test("signup stays available without email and old resend routes return to sign-in", async ({
    page,
  }) => {
    await page.goto("/auth/signup");
    await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeEnabled();
    await expect(
      page.getByText("No verification email is needed.", { exact: false }),
    ).toBeVisible();
    await page.goto("/auth/resend");
    await expect(page).toHaveURL(/\/auth\/signin$/);
  });
  test("invalid verification links recover without exposing errors", async ({ page }) => {
    await page.goto("/auth/callback?token_hash=invalid&type=unsupported");
    await expect(page).toHaveURL(/\/auth\/link-error/);
    await expect(
      page.getByRole("heading", { name: "This link could not be verified." }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Reset password", exact: true })).toBeVisible();
  });
  test("account and auth API reject foreign origins and unauthenticated writes", async ({
    request,
  }) => {
    const read = await request.get("/api/account");
    expect(read.status()).toBe(401);
    expect(read.headers()["cache-control"]).toContain("no-store");
    for (const endpoint of ["/api/account", "/api/auth"]) {
      const r = await request.post(endpoint, {
        headers: { Origin: "https://evil.example" },
        data: { action: "signout" },
      });
      expect(r.status()).toBe(403);
    }
    const sameOrigin = { Origin: "http://127.0.0.1:3000" };
    const mutation = await request.post("/api/account", {
      headers: sameOrigin,
      data: { action: "preferences", values: { emailMarketing: false } },
    });
    expect(mutation.status()).toBe(401);
    const signup = await request.post("/api/auth", {
      headers: sameOrigin,
      data: { action: "reset", email: "owner@example.invalid" },
    });
    expect(signup.status()).toBe(503);
  });
  test("five test product routes support distinct prices and stock states", async ({ page }) => {
    for (const slug of [
      "test-aurelia-floor-lamp",
      "test-sable-planter",
      "test-table-lamp",
      "test-decorative-mirror",
      "test-scented-candle",
    ]) {
      const response = await page.goto(`/products/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
    }
    await expect(
      page.getByRole("main").getByRole("button", { name: "Currently unavailable", exact: true }),
    ).toBeDisabled();
  });
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    test(`sign-in reflows and respects reduced motion at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/auth/signin");
      await expect(page.getByRole("heading", { name: "Welcome home." })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await page.getByLabel("Email address", { exact: true }).focus();
      await expect(page.getByLabel("Email address", { exact: true })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
    });
  }
});
