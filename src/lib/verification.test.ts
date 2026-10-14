import { expect, it } from "vitest";
import { staffContactLinks, verificationActionSchema, verificationError } from "./verification";
const base = {
  orderId: "94000000-0000-4000-8000-000000000001",
  requestId: "94000000-0000-4000-8000-000000000002",
  input: { action: "confirm", expectedRevision: 0, note: "Customer verified" },
};
it("requires a bounded private note, revision and idempotency UUID", () => {
  expect(verificationActionSchema.safeParse(base).success).toBe(true);
  for (const changes of [
    { note: "  " },
    { note: "a".repeat(2001) },
    { expectedRevision: -1 },
    { expectedRevision: 1.5 },
    { price: 1 },
  ])
    expect(
      verificationActionSchema.safeParse({ ...base, input: { ...base.input, ...changes } }).success,
    ).toBe(false);
  expect(verificationActionSchema.safeParse({ ...base, requestId: "unknown" }).success).toBe(false);
});
it("validates contact outcomes and forbids customer/staff identity overrides", () => {
  const contact = {
    ...base,
    input: { ...base.input, action: "contact", channel: "phone", outcome: "no_response" },
  };
  expect(verificationActionSchema.safeParse(contact).success).toBe(true);
  expect(verificationActionSchema.safeParse({ ...contact, staffId: "foreign" }).success).toBe(
    false,
  );
  expect(
    verificationActionSchema.safeParse({
      ...contact,
      input: { ...contact.input, outcome: "verified" },
    }).success,
  ).toBe(false);
});
it("does not build unsafe contact URLs or email header injections", () => {
  expect(
    staffContactLinks(
      "javascript:alert(1)",
      "https://evil.example",
      "owner@example.com\r\nBcc:foreign@example.com",
      100001,
    ),
  ).toEqual({ phone: null, whatsapp: null, email: null });
  expect(staffContactLinks("+923001234567", null, "customer@example.com", 100001)).toEqual({
    phone: "tel:+923001234567",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:customer%40example.com?subject=DWELLUNE%20order%20100001%20verification",
  });
});
it("never exposes unknown database error text", () =>
  expect(verificationError("private sql/provider data")).not.toContain("private sql"));
