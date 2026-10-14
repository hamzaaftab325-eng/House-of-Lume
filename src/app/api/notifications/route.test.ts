import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ feed: vi.fn(), unread: vi.fn(), read: vi.fn() }));
vi.mock("@/server/notifications/notifications.service", () => ({
  notificationFeed: mocks.feed,
  notificationUnread: mocks.unread,
  notificationRead: mocks.read,
}));
import { GET, POST } from "./route";
const valid = { action: "read", audience: "customer", id: "a1000000-0000-4000-8000-000000000001" };
const post = (input: unknown, origin = "http://localhost:3000") =>
  new NextRequest("http://localhost:3000/api/notifications", {
    method: "POST",
    headers: { Origin: origin, Host: "localhost:3000", "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.unread.mockResolvedValue({ unread: 3, customerId: "a" });
  mocks.read.mockResolvedValue({ unread: 2 });
});
it("returns only guarded private badge data", async () => {
  const r = await GET(
    new NextRequest("http://localhost:3000/api/notifications?audience=customer&summary=1"),
  );
  expect(r.status).toBe(200);
  expect(r.headers.get("cache-control")).toContain("no-store");
  expect(mocks.unread).toHaveBeenCalledWith("customer");
  expect(mocks.feed).not.toHaveBeenCalled();
});
it("rejects foreign-origin writes", async () => {
  expect((await POST(post(valid, "https://evil.example"))).status).toBe(403);
  expect(mocks.read).not.toHaveBeenCalled();
});
it("rejects caller recipient and reset overrides", async () => {
  expect((await POST(post({ ...valid, userId: "foreign" }))).status).toBe(400);
  expect(mocks.read).not.toHaveBeenCalled();
});
it("validates bounded queries", async () => {
  expect(
    (
      await GET(
        new NextRequest("http://localhost:3000/api/notifications?audience=staff&before=bad"),
      )
    ).status,
  ).toBe(400);
  expect(mocks.feed).not.toHaveBeenCalled();
});
for (const [code, status] of [
  ["authentication_required", 401],
  ["staff_access_required", 403],
  ["notification_unavailable", 404],
  ["notification_cursor_unavailable", 409],
  ["database offline", 503],
] as const)
  it(`maps ${code} safely`, async () => {
    mocks.read.mockRejectedValue(new Error(code));
    const r = await POST(post(valid));
    expect(r.status).toBe(status);
    expect(r.headers.get("cache-control")).toContain("no-store");
    expect(JSON.stringify(await r.json())).not.toContain("database offline");
  });
it("keeps the immutable mark-all cutoff", async () => {
  const input = { action: "readAll", audience: "staff", cutoff: "2026-10-14T00:00:00Z" };
  expect((await POST(post(input))).status).toBe(200);
  expect(mocks.read).toHaveBeenCalledWith(input);
});
