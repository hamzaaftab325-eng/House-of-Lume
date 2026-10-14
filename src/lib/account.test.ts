import { describe, expect, it } from "vitest";
import { accountActionSchema, addressSchema, profileSchema, safeAccountRedirect } from "./account";

describe("account boundaries", () => {
  it("accepts local return paths and normalizes them", () => {
    expect(safeAccountRedirect("/shop?category=lighting#objects")).toBe(
      "/shop?category=lighting#objects",
    );
    expect(safeAccountRedirect("/account/orders/../addresses")).toBe("/account/addresses");
  });
  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/auth/signin",
    "/\nLocation:evil.example",
    "javascript:alert(1)",
    undefined,
  ])("rejects unsafe or recursive redirect %s", (value) => {
    expect(safeAccountRedirect(value)).toBe("/account");
  });
  it("rejects ownership and privilege fields on profile mutations", () => {
    const values = { name: "Valid name", phone: "", whatsapp: "" };
    expect(profileSchema.safeParse({ ...values, status: "active" }).success).toBe(false);
    expect(
      accountActionSchema.safeParse({ action: "profile", values, customerId: crypto.randomUUID() })
        .success,
    ).toBe(false);
  });
  it("validates Pakistan addresses without permitting foreign country or owner fields", () => {
    const values = {
      label: "",
      recipient: "Valid recipient",
      phone: "+923000000000",
      line1: "Valid street address",
      line2: "",
      city: "Lahore",
      province: "Punjab",
      postalCode: "54000",
      default: true,
    };
    expect(addressSchema.safeParse(values).success).toBe(true);
    expect(addressSchema.safeParse({ ...values, country: "US" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...values, customer_id: crypto.randomUUID() }).success).toBe(
      false,
    );
    expect(addressSchema.safeParse({ ...values, postalCode: "123" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...values, province: "Unknown" }).success).toBe(false);
  });
  it("requires a replay key and positive bounded item quantities for return requests", () => {
    const values = {
      action: "return",
      orderId: crypto.randomUUID(),
      requestId: crypto.randomUUID(),
      reason: "merchant_defined_reason",
      detail: "",
      items: [{ id: crypto.randomUUID(), quantity: 1 }],
    };
    expect(accountActionSchema.safeParse(values).success).toBe(true);
    expect(accountActionSchema.safeParse({ ...values, requestId: undefined }).success).toBe(false);
    expect(
      accountActionSchema.safeParse({ ...values, items: [{ ...values.items[0], quantity: 0 }] })
        .success,
    ).toBe(false);
    expect(
      accountActionSchema.safeParse({ ...values, items: [{ ...values.items[0], quantity: 100 }] })
        .success,
    ).toBe(false);
    expect(accountActionSchema.safeParse({ ...values, items: [] }).success).toBe(false);
  });
});
