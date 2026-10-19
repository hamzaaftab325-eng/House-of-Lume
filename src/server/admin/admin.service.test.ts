import { beforeEach, expect, it, vi } from "vitest";
const sdk = vi.hoisted(() => ({ user: vi.fn(), rpc: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: sdk.user }, rpc: sdk.rpc, from: sdk.from }),
}));
import { adminIdentity } from "./admin.service";
const userId = "13ea3052-462e-473f-b023-346a163eaf3a";
beforeEach(() => {
  vi.resetAllMocks();
  sdk.user.mockResolvedValue({ data: { user: { id: userId } }, error: null });
});
it("requires authentication before querying owner access", async () => {
  sdk.user.mockResolvedValue({ data: { user: null }, error: null });
  await expect(adminIdentity()).rejects.toThrow("authentication_required");
  expect(sdk.rpc).not.toHaveBeenCalled();
});
it("rejects anonymous accounts", async () => {
  sdk.user.mockResolvedValue({ data: { user: { id: userId, is_anonymous: true } }, error: null });
  await expect(adminIdentity()).rejects.toThrow("authentication_required");
});
it("requires a live database session", async () => {
  sdk.rpc.mockResolvedValue({ data: null, error: { message: "authentication_required" } });
  await expect(adminIdentity()).rejects.toThrow("authentication_required");
});
it("does not grant access from user-editable metadata", async () => {
  sdk.user.mockResolvedValue({
    data: { user: { id: userId, user_metadata: { role: "super_admin" } } },
    error: null,
  });
  sdk.rpc.mockResolvedValue({ data: null, error: { message: "staff_access_required" } });
  await expect(adminIdentity()).rejects.toThrow("admin_access_required");
});
it("accepts the owner independently of a customer profile", async () => {
  const identity = { userId, email: "owner@example.invalid" };
  sdk.rpc.mockResolvedValue({ data: identity, error: null });
  await expect(adminIdentity()).resolves.toEqual(identity);
  expect(sdk.rpc).toHaveBeenCalledWith("owner_context");
  expect(sdk.from).not.toHaveBeenCalled();
});
it.each([
  null,
  { userId, email: "invalid" },
  { userId: "e901a100-0000-4000-8000-000000000001", email: "other@example.invalid" },
])("fails closed on malformed or mismatched owner context %j", async (data) => {
  sdk.rpc.mockResolvedValue({ data, error: null });
  await expect(adminIdentity()).rejects.toThrow("admin_context_unavailable");
});
it("keeps infrastructure failures distinct from denied access", async () => {
  sdk.rpc.mockResolvedValue({ data: null, error: { message: "database unavailable" } });
  await expect(adminIdentity()).rejects.toThrow("admin_context_unavailable");
});
