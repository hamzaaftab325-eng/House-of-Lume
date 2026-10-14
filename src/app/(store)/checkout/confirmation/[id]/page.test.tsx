import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
const sdk = vi.hoisted(() => ({ confirmation: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "a".repeat(64) }) }),
}));
vi.mock("@/server/checkout/checkout.service", () => ({ orderConfirmation: sdk.confirmation }));
vi.mock("@/components/ui/controls", () => ({
  DwelluneButtonLink: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
import Page from "./page";
const id = "89600000-0000-4000-8000-000000000001";
const order = {
  id,
  order_number: 100999,
  authenticated: false,
  status: "pending_verification",
  verification_status: "pending",
  payment_method: "cash_on_delivery",
  placed_at: "2026-10-14T10:00:00Z",
  subtotal_pkr: 2000,
  discount_pkr: 0,
  shipping_pkr: 250,
  tax_pkr: 0,
  total_pkr: 2250,
  email_status: "pending",
  lines: [
    {
      name: "Fixture lamp",
      variant: "Bronze",
      quantity: 2,
      unit_price_pkr: 1000,
      line_total_pkr: 2000,
    },
  ],
};
beforeEach(() => {
  vi.resetAllMocks();
  sdk.confirmation.mockResolvedValue(order);
});
it("shows canonical order totals, pending verification and queued email honestly", async () => {
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id }) }));
  expect(html).toContain("Order 100999 received.");
  expect(html).toContain("awaiting verification");
  expect(html).toContain("2,250");
  expect(html).toContain("Confirmation email queued.");
  expect(html).not.toContain("View order");
});
it("gives the registered customer an owned account link and explains email failure", async () => {
  sdk.confirmation.mockResolvedValue({ ...order, authenticated: true, email_status: "failed" });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id }) }));
  expect(html).toContain(`/account/orders/${id}`);
  expect(html).toContain("confirmation email needs attention");
});
it("hides unavailable orders and lets infrastructure failures reach the retry boundary", async () => {
  sdk.confirmation.mockRejectedValue(new Error("order_unavailable"));
  expect(renderToStaticMarkup(await Page({ params: Promise.resolve({ id }) }))).toContain(
    "Order confirmation unavailable.",
  );
  sdk.confirmation.mockRejectedValue(new Error("database timeout"));
  await expect(Page({ params: Promise.resolve({ id }) })).rejects.toThrow("database timeout");
});
