import { expect, it } from "vitest";
import { emailEventSchema, renderOwnerTestEmail, renderTransactionalEmail } from "./templates";

const input = {
  event: "order.placed" as const,
  subject: "DWELLUNE — Order 100001 received",
  text: "Ceramic vase × 2 — PKR 4800\n\nSubtotal: PKR 4800\nDelivery: PKR 250\nDue on delivery: PKR 5050",
  siteUrl: "https://dwellune.vercel.app",
  orderId: "91000000-0000-4000-8000-000000000002",
};

it.each(emailEventSchema.options)("renders accessible HTML and text for %s", (event) => {
  const email = renderTransactionalEmail({ ...input, event });
  expect(email.html).toContain('<html lang="en" dir="ltr">');
  expect(email.html).toContain('role="presentation" lang="en" dir="ltr"');
  expect(email.html.match(/<h1>/g)).toHaveLength(1);
  expect(email.html).toContain('alt="DWELLUNE Home Décor"');
  expect(email.html).not.toContain('style="');
  expect(email.html).toContain(`https://dwellune.vercel.app/account/orders/${input.orderId}`);
  expect(email.html).toContain("Due on delivery: PKR 5050");
  expect(email.text).toContain(input.text);
  expect(email.text).toContain("Guest customers can reply with their order number");
  expect(email.subject).toBe(input.subject);
});

it("escapes customer content rather than interpreting it as HTML or links", () => {
  const email = renderTransactionalEmail({
    ...input,
    subject: 'Order "<unsafe>"',
    text: '<img src=x onerror="alert(1)">\nhttps://evil.example',
  });
  expect(email.html).not.toContain("<img src=x");
  expect(email.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  expect(email.html).not.toContain('href="https://evil.example');
  expect(email.html).toContain("<title>Order &quot;&lt;unsafe&gt;&quot;</title>");
});

it.each([
  "javascript:alert(1)",
  "http://evil.example",
  "https://user:password@dwellune.vercel.app",
  "https://dwellune.vercel.app/?token=secret",
  "https://dwellune.vercel.app/#secret",
  "https://dwellune.vercel.app/untrusted",
])("rejects unsafe mail origin %s", (siteUrl) => {
  expect(() => renderTransactionalEmail({ ...input, siteUrl })).toThrow();
});

it("rejects header injection and invalid event/order identifiers", () => {
  expect(() =>
    renderTransactionalEmail({ ...input, subject: "Order\r\nBcc: attacker@example.com" }),
  ).toThrow();
  expect(() => renderTransactionalEmail({ ...input, orderId: 'x" onclick="evil()' })).toThrow();
  expect(() =>
    renderTransactionalEmail({ ...input, event: "order.shipped" as "order.placed" }),
  ).toThrow();
});

it("does not promise approval, refunds, or account activation in an order review email", () => {
  const verification = renderTransactionalEmail({ ...input, event: "order.verification_required" });
  expect(verification.text).toContain("your account is already active");
  const returns = renderTransactionalEmail({ ...input, event: "return.requested" });
  expect(returns.text).toContain("does not mean your return or refund has been approved");
});

it("marks owner test samples explicitly and avoids links to fabricated orders", () => {
  const email = renderOwnerTestEmail(input.siteUrl);
  expect(email.html).toContain("TEST EMAIL");
  expect(email.text).toContain("No order was created and no payment is due");
  expect(email.html).not.toContain("/account/orders/");
  expect(email.html).toContain('href="https://dwellune.vercel.app/account"');
});
