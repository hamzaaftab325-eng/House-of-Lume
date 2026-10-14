import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
const service = vi.hoisted(() => ({ context: vi.fn(), quote: vi.fn() }));
vi.mock("@/server/checkout/checkout.service", () => ({
  checkoutContext: service.context,
  checkoutQuote: service.quote,
}));
import { GET, POST } from "./route";
const input = {
  name: "Test recipient",
  email: "owner@example.invalid",
  phone: "03001234567",
  address: {
    line1: "Test street 123",
    line2: "",
    city: "Lahore",
    province: "Punjab",
    postalCode: "54000",
    country: "PK",
  },
  notes: "",
  terms: true,
};
function request(body: unknown, origin = "https://dwellune.vercel.app") {
  return new NextRequest("https://dwellune.vercel.app/api/checkout", {
    method: "POST",
    headers: {
      origin,
      host: "dwellune.vercel.app",
      "content-type": "application/json",
      cookie: `dwellune-guest-cart=${"a".repeat(64)}`,
    },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  service.context.mockResolvedValue({ authenticated: false, addresses: [] });
  service.quote.mockResolvedValue({ revision: "b".repeat(64) });
});
it("uses the secure cart cookie hash and marks private responses uncacheable", async () => {
  const r = await POST(request(input));
  expect(r.status).toBe(200);
  expect(service.quote).toHaveBeenCalledWith(
    createHash("sha256").update("a".repeat(64)).digest("hex"),
    input,
  );
  expect(r.headers.get("cache-control")).toContain("no-store");
});
it("denies cross-site quoting before touching commerce", async () => {
  expect((await POST(request(input, "https://evil.example"))).status).toBe(403);
  expect(service.quote).not.toHaveBeenCalled();
});
it("rejects supplied prices or customer ownership", async () => {
  expect((await POST(request({ ...input, customerId: "someone", total_pkr: 1 }))).status).toBe(400);
  expect(service.quote).not.toHaveBeenCalled();
});
it("returns field errors without invoking commerce on invalid details", async () => {
  const r = await POST(request({ ...input, phone: "bad" }));
  expect(r.status).toBe(400);
  expect((await r.json()).fields).toEqual(
    expect.arrayContaining([expect.objectContaining({ path: "phone" })]),
  );
  expect(service.quote).not.toHaveBeenCalled();
});
it("does not expose raw database messages", async () => {
  service.quote.mockRejectedValue(new Error("secret database detail"));
  const r = await POST(request(input));
  expect(r.status).toBe(409);
  expect(await r.text()).not.toContain("secret database detail");
});
it("requires a real account session for signed-in bootstrap", async () => {
  service.context.mockRejectedValue(new Error("authentication_required"));
  expect((await GET()).status).toBe(401);
});
