import { expect, it } from "vitest";
import { checkoutInputSchema } from "./checkout";
const valid = {
  name: "Test recipient",
  email: "owner@example.invalid",
  phone: "03001234567",
  address: {
    line1: "Test street 123",
    line2: "",
    city: "Lahore",
    province: "Punjab",
    postalCode: "54000",
    country: "PK",
  },
  notes: "",
  terms: true,
};
it("normalizes a Pakistan mobile number", () =>
  expect(checkoutInputSchema.parse({ ...valid, phone: "+92 300 1234567" }).phone).toBe(
    "+923001234567",
  ));
it.each([{ total_pkr: 1 }, { customerId: "other" }, { paymentMethod: "card" }])(
  "rejects client-supplied business authority %s",
  (extra) => expect(checkoutInputSchema.safeParse({ ...valid, ...extra }).success).toBe(false),
);
it.each([
  { phone: "12345" },
  { terms: false },
  { address: { ...valid.address, country: "US" } },
  { address: { ...valid.address, postalCode: "AB123" } },
])("rejects invalid contact, geography and consent %s", (extra) =>
  expect(checkoutInputSchema.safeParse({ ...valid, ...extra }).success).toBe(false),
);
