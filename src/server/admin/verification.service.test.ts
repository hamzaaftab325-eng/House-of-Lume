import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ identity: vi.fn(), rpc: vi.fn() }));
vi.mock("./admin.service", () => ({ adminIdentity: mocks.identity }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: mocks.rpc }) }));
import { verificationQueue, verificationDetail, verificationAction } from "./verification.service";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.identity.mockResolvedValue({ customerId: "test" });
});
it("validates staff access before reading order details", async () => {
  mocks.identity.mockRejectedValue(new Error("staff_access_required"));
  await expect(verificationDetail("id")).rejects.toThrow("staff_access_required");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("rejects broken queue responses instead of rendering unvalidated data", async () => {
  mocks.rpc.mockResolvedValue({ data: { items: [{ contact_name: "private" }] }, error: null });
  await expect(verificationQueue("pending", null)).rejects.toThrow();
});
it("preserves ambiguous action results as infrastructure errors", async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: null });
  await expect(
    verificationAction({
      orderId: "94000000-0000-4000-8000-000000000001",
      requestId: "94000000-0000-4000-8000-000000000002",
      input: { action: "confirm", expectedRevision: 0, note: "Customer verified" },
    }),
  ).rejects.toThrow("verification_result_unavailable");
});
