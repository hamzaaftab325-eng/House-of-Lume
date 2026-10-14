import { beforeEach, expect, it, vi } from "vitest";
const sdk = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: sdk.getUser }, rpc: sdk.rpc, from: sdk.from }),
}));
import { checkoutQuote } from "./checkout.service";
import { checkoutInputSchema } from "@/lib/checkout";
const input = checkoutInputSchema.parse({
  name: "Test",
  email: "owner@example.invalid",
  phone: "03001234567",
  address: {
    line1: "Test street",
    line2: "",
    city: "Lahore",
    province: "Punjab",
    postalCode: "",
    country: "PK",
  },
  savedAddressId: "88800000-0000-4000-8000-000000000001",
  notes: "",
  terms: true,
});
beforeEach(() => {
  vi.resetAllMocks();
});
it("does not let guest callers select a saved customer address", async () => {
  sdk.getUser.mockResolvedValue({
    data: { user: null },
    error: { name: "AuthSessionMissingError" },
  });
  await expect(checkoutQuote("guest", input)).rejects.toThrow("saved_address_unavailable");
  expect(sdk.from).not.toHaveBeenCalled();
  expect(sdk.rpc).not.toHaveBeenCalled();
});
it("rejects expired sessions rather than silently using guest access", async () => {
  sdk.getUser.mockResolvedValue({
    data: { user: { id: "a", email: "owner@example.invalid" } },
    error: null,
  });
  sdk.rpc.mockResolvedValue({ data: false, error: null });
  await expect(checkoutQuote("guest", input)).rejects.toThrow("authentication_required");
  expect(sdk.from).not.toHaveBeenCalled();
});
it("rejects a missing or foreign saved address before quoting", async () => {
  sdk.getUser.mockResolvedValue({
    data: { user: { id: "a", email: "owner@example.invalid" } },
    error: null,
  });
  sdk.rpc.mockResolvedValue({ data: true, error: null });
  const conditions: string[][] = [];
  sdk.from.mockImplementation((table: string) => {
    const chain = {
      select: () => chain,
      eq: (k: string, v: string) => {
        conditions.push([table, k, v]);
        return chain;
      },
      maybeSingle: async () => ({
        data: table === "customers" ? { id: "customer-a" } : null,
        error: null,
      }),
    };
    return chain;
  });
  await expect(checkoutQuote("guest", input)).rejects.toThrow("saved_address_unavailable");
  expect(conditions).toContainEqual(["customer_addresses", "customer_id", "customer-a"]);
  expect(sdk.rpc).toHaveBeenCalledTimes(1);
});
it("verifies account sessions before order placement", async () => {
  sdk.getUser.mockResolvedValue({
    data: { user: { id: "a", email: "a@example.invalid" } },
    error: null,
  });
  sdk.rpc.mockResolvedValue({ data: false, error: null });
  const { placeOrder } = await import("./checkout.service");
  await expect(
    placeOrder("", {
      input,
      idempotencyKey: "89500000-0000-4000-8000-000000000001",
      revision: "a".repeat(64),
    }),
  ).rejects.toThrow("authentication_required");
  expect(sdk.rpc).toHaveBeenCalledTimes(1);
});
