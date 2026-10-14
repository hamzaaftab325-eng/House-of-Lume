import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ action: vi.fn() }));
vi.mock("@/server/admin/verification.service", () => ({ verificationAction: mocks.action }));
import { POST } from "./route";
const body = {
  orderId: "94000000-0000-4000-8000-000000000001",
  requestId: "94000000-0000-4000-8000-000000000002",
  input: { action: "confirm", expectedRevision: 0, note: "Verified customer" },
};
function request(origin = "https://dwellune.vercel.app", input: unknown = body) {
  return new NextRequest("https://dwellune.vercel.app/api/admin/verification", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}
beforeEach(() => vi.resetAllMocks());
it("rejects foreign-origin requests before any staff action", async () => {
  expect((await POST(request("https://evil.example"))).status).toBe(403);
  expect(mocks.action).not.toHaveBeenCalled();
});
it("rejects tampered inputs", async () => {
  expect(
    (await POST(request(undefined, { ...body, input: { ...body.input, customerId: "other" } })))
      .status,
  ).toBe(400);
  expect(mocks.action).not.toHaveBeenCalled();
});
it.each([
  ["authentication_required", 401],
  ["staff_access_required", 403],
  ["order_unavailable", 404],
  ["verification_changed", 409],
  ["cancellation_unavailable", 409],
  ["verification_result_unavailable", 503],
  ["database private error", 503],
])("maps %s safely without clearing uncertain retries", async (code, status) => {
  mocks.action.mockRejectedValue(new Error(code));
  const response = await POST(request());
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(await response.text()).not.toContain("database private error");
});
it("passes the original idempotency key and validated input", async () => {
  mocks.action.mockResolvedValue({
    id: body.orderId,
    status: "confirmed",
    verification_status: "admin_approved",
    verification_revision: 1,
  });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.action).toHaveBeenCalledWith(body);
});
