import { expect, test } from "@playwright/test";
import { emailEventSchema, renderTransactionalEmail } from "../../src/server/email/templates";

for (const width of [320, 375, 768, 1440]) {
  test(`transactional emails remain readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route("**/email-logo.png", (route) =>
      route.fulfill({ path: "public/email-logo.png", contentType: "image/png" }),
    );
    for (const event of emailEventSchema.options) {
      const email = renderTransactionalEmail({
        event,
        subject: "DWELLUNE — order update",
        text:
          "Sample order #100001\n\nCeramic vase / Sand × 1 — PKR 2400\nLinen cushion cover / Natural × 1 — PKR 1800\n\nSubtotal: PKR 4200\nDelivery: PKR 250\nDue on delivery: PKR 4450\n\n" +
          "LongProductName".repeat(20),
        siteUrl: "https://dwellune.vercel.app",
        orderId: "91000000-0000-4000-8000-000000000002",
      });
      await page.setContent(email.html);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("link", { name: "View order in your account" })).toHaveAttribute(
        "href",
        "https://dwellune.vercel.app/account/orders/91000000-0000-4000-8000-000000000002",
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      expect(
        await page
          .getByRole("img")
          .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      ).toBe(true);
      if (event === "order.placed" && [375, 1440].includes(width))
        await page.screenshot({ path: `../phase11-email-${width}.png`, fullPage: true });
    }
  });
}

test("email has readable dark mode and stripped-CSS fallbacks", async ({ page }) => {
  const email = renderTransactionalEmail({
    event: "order.cancelled",
    subject: "Order cancelled",
    text: "Order #100001",
    siteUrl: "https://dwellune.vercel.app",
  });
  await page.route("**/email-logo.png", (route) =>
    route.fulfill({ path: "public/email-logo.png", contentType: "image/png" }),
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setContent(email.html);
  await expect(page.getByRole("heading")).toHaveCSS("color", "rgb(255, 248, 238)");
  await expect(page.getByRole("link", { name: "Visit your account" })).toHaveCSS(
    "color",
    "rgb(40, 17, 3)",
  );
  await page.screenshot({ path: "../phase11-email-dark.png", fullPage: true });
  await page.setContent(email.html.replace(/<style>[\s\S]*?<\/style>/, ""));
  await expect(page.getByRole("heading")).toBeVisible();
  await expect(page.getByRole("link", { name: "Visit your account" })).toBeVisible();
  await expect(page.getByText("No COD payment is due", { exact: false })).toBeVisible();
});
