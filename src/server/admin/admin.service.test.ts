import { beforeEach, expect, it, vi } from "vitest";
const sdk = vi.hoisted(() => ({ user: vi.fn(), rpc: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: sdk.user }, rpc: sdk.rpc, from: sdk.from }),
}));
import { adminIdentity } from "./admin.service";
beforeEach(() => {
  vi.resetAllMocks();
});
it("requires authentication before reading staff data", async () => {
  sdk.user.mockResolvedValue({ data: { user: null }, error: null });
  await expect(adminIdentity()).rejects.toThrow("authentication_required");
  expect(sdk.from).not.toHaveBeenCalled();
});
it("requires a live session before any staff lookup", async () => {
  sdk.user.mockResolvedValue({
    data: { user: { id: "user", email: "owner@example.invalid" } },
    error: null,
  });
  sdk.rpc.mockResolvedValue({ data: false, error: null });
  await expect(adminIdentity()).rejects.toThrow("authentication_required");
  expect(sdk.from).not.toHaveBeenCalled();
});
it("does not grant administrator access from user-editable metadata", async () => {
  sdk.user.mockResolvedValue({
    data: { user: { id: "user", user_metadata: { role: "super_admin" } } },
    error: null,
  });
  sdk.rpc.mockResolvedValue({ data: true, error: null });
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => ({ data: null, error: null }),
  };
  sdk.from.mockReturnValue(chain);
  await expect(adminIdentity()).rejects.toThrow("staff_access_required");
});
