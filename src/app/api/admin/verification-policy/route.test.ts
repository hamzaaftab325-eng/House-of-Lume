import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ policy: vi.fn() }));
vi.mock("@/server/admin/verification-policy.service", () => ({ verificationPolicy: mocks.policy }));
import { GET, POST } from "./route";
const values = {
  verificationRequired: true,
  highValuePkr: 25000,
  duplicateWindowHours: 24,
  failedDeliveryCount: 2,
  failedDeliveryLookbackDays: 180,
  maxOrders24h: 5,
  maxOrdersHour: 3,
};
const payload = {
  requestId: "98000000-0000-4000-8000-000000000001",
  expectedRevision: 0,
  note: "Owner adjusted rules",
  values,
};
function request(origin = "https://dwellune.vercel.app", body: unknown = payload) {
  return new NextRequest("https://dwellune.vercel.app/api/admin/verification-policy", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
beforeEach(() => vi.resetAllMocks());
it("rejects foreign origins before saving rules", async () => {
  expect((await POST(request("https://evil.example"))).status).toBe(403);
  expect(mocks.policy).not.toHaveBeenCalled();
});
it("rejects limits that exceed the daily cap", async () => {
  expect(
    (await POST(request(undefined, { ...payload, values: { ...values, maxOrdersHour: 6 } })))
      .status,
  ).toBe(400);
  expect(mocks.policy).not.toHaveBeenCalled();
});
it("rejects unknown owner/gate fields", async () => {
  expect((await POST(request(undefined, { ...payload, ordersEnabled: true }))).status).toBe(400);
  expect(mocks.policy).not.toHaveBeenCalled();
});
it.each([
  ["authentication_required", 401],
  ["staff_access_required", 403],
  ["verification_changed", 409],
  ["verification_idempotency_conflict", 409],
  ["verification_policy_unavailable", 503],
])("maps %s safely", async (code, status) => {
  mocks.policy.mockRejectedValue(new Error(code));
  expect((await POST(request())).status).toBe(status);
});
it("reads private rules without exposing errors", async () => {
  mocks.policy.mockResolvedValue({ ...values, revision: 0 });
  const r = await GET();
  expect(r.status).toBe(200);
  expect(r.headers.get("Cache-Control")).toContain("no-store");
});
it("passes immutable request identity and validated values", async () => {
  mocks.policy.mockResolvedValue({ ...values, revision: 1 });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.policy).toHaveBeenCalledWith(payload);
});
