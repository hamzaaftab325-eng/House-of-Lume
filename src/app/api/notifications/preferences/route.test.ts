import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ preferences: vi.fn() }));
vi.mock("@/server/notifications/controls.service", () => ({
  notificationPreferences: mocks.preferences,
}));
import { GET, POST } from "./route";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.preferences.mockResolvedValue({
    productUpdates: false,
    emailMarketing: false,
    essentialUpdates: true,
  });
});
const post = (values: unknown, origin = "http://localhost:3000") =>
  new NextRequest("http://localhost:3000/api/notifications/preferences", {
    method: "POST",
    headers: { Host: "localhost:3000", Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
it("reads private preferences", async () => {
  const r = await GET();
  expect(r.status).toBe(200);
  expect(r.headers.get("cache-control")).toContain("no-store");
});
it("rejects foreign origins", async () => {
  expect((await POST(post({}, "https://evil.example"))).status).toBe(403);
  expect(mocks.preferences).not.toHaveBeenCalled();
});
it("rejects essential and recipient overrides", async () => {
  for (const extra of [{ essentialUpdates: false }, { customerId: "foreign" }])
    expect(
      (await POST(post({ productUpdates: true, emailMarketing: false, ...extra }))).status,
    ).toBe(400);
  expect(mocks.preferences).not.toHaveBeenCalled();
});
it("preserves optional choices", async () => {
  const values = { productUpdates: true, emailMarketing: false };
  expect((await POST(post(values))).status).toBe(200);
  expect(mocks.preferences).toHaveBeenCalledWith(values);
});
for (const [code, status] of [
  ["authentication_required", 401],
  ["staff_access_required", 403],
  ["unknown failure", 503],
] as const)
  it(`preserves ${code} boundary`, async () => {
    mocks.preferences.mockRejectedValue(new Error(code));
    expect((await GET()).status).toBe(status);
  });
