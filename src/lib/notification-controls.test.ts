import { expect, it } from "vitest";
import {
  preferenceValuesSchema,
  preferenceSchema,
  deliveryFilterSchema,
} from "./notification-controls";
it("optional settings cannot disable essential messages or choose a recipient", () => {
  expect(preferenceValuesSchema.parse({ productUpdates: false, emailMarketing: false })).toEqual({
    productUpdates: false,
    emailMarketing: false,
  });
  for (const extra of [
    { essentialUpdates: false },
    { customerId: "foreign" },
    { emailOrderUpdates: false },
  ])
    expect(
      preferenceValuesSchema.safeParse({ productUpdates: false, emailMarketing: false, ...extra })
        .success,
    ).toBe(false);
  expect(
    preferenceSchema.safeParse({
      productUpdates: false,
      emailMarketing: false,
      essentialUpdates: false,
    }).success,
  ).toBe(false);
});
it("only known delivery states are accepted", () => {
  expect(deliveryFilterSchema.parse("failed")).toBe("failed");
  expect(deliveryFilterSchema.safeParse("delivered").success).toBe(false);
});
