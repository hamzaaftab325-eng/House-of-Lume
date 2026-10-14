import { expect, it } from "vitest";
import { safeNotificationLink, notificationQuerySchema, readSchema } from "./notifications";
it("allows only implemented, audience-safe notification routes", () => {
  const id = "a1000000-0000-4000-8000-000000000001";
  expect(safeNotificationLink(`/account/orders/${id}`, "customer")).toBe(`/account/orders/${id}`);
  expect(safeNotificationLink(`/crm/verification/${id}`, "staff")).toBe(`/crm/verification/${id}`);
  expect(safeNotificationLink(`/crm/verification/${id}`, "customer")).toBeNull();
  expect(safeNotificationLink("/products/amber-lamp", "customer")).toBe("/products/amber-lamp");
  for (const value of [
    "https://evil.example",
    "//evil.example",
    "/auth/signin",
    "/account/orders/bad",
    "/products/../../admin",
    "/account?next=https://evil.example",
    "/products/a%2fb",
  ]) {
    expect(safeNotificationLink(value, "customer")).toBeNull();
  }
});
it("validates category, priority, cursor and recipient selection", () => {
  expect(notificationQuerySchema.parse({ audience: "customer" })).toMatchObject({
    read: "all",
    category: "all",
    priority: "all",
  });
  for (const input of [
    { audience: "customer", before: "bad" },
    { audience: "staff", category: "invented" },
    { audience: "staff", priority: "urgent" },
    { audience: "customer", userId: "another" },
  ])
    expect(notificationQuerySchema.safeParse(input).success).toBe(false);
});
it("read requests cannot alter recipients or read timestamps", () => {
  expect(
    readSchema.safeParse({
      action: "read",
      audience: "customer",
      id: "a1000000-0000-4000-8000-000000000001",
    }).success,
  ).toBe(true);
  expect(
    readSchema.safeParse({ action: "readAll", audience: "staff", cutoff: "2026-10-14T00:00:00Z" })
      .success,
  ).toBe(true);
  for (const input of [
    { action: "readAll", audience: "staff" },
    { action: "readAll", audience: "customer", cutoff: "invalid" },
    {
      action: "read",
      audience: "customer",
      id: "a1000000-0000-4000-8000-000000000001",
      read_at: null,
    },
  ])
    expect(readSchema.safeParse(input).success).toBe(false);
});
