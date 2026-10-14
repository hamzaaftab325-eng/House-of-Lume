import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
const sdk = vi.hoisted(() => ({ place: vi.fn(), recover: vi.fn() }));
vi.mock("@/server/checkout/checkout.service", () => ({
  placeOrder: sdk.place,
  recoverOrderAttempt: sdk.recover,
}));
import { POST, GET } from "./route";
const payload = {
  idempotencyKey: "89500000-0000-4000-8000-000000000001",
  revision: "b".repeat(64),
  input: {
    name: "Test recipient",
    email: "test@example.invalid",
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
  },
};
function request(body: unknown, origin = "https://dwellune.vercel.app") {
  return new NextRequest("https://dwellune.vercel.app/api/checkout/orders", {
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
  sdk.place.mockResolvedValue({ id: "order" });
  sdk.recover.mockResolvedValue(null);
});
it("uses cookie identity and preserves the same attempt for replay", async () => {
  expect((await POST(request(payload))).status).toBe(200);
  await POST(request(payload));
  expect(sdk.place).toHaveBeenNthCalledWith(
    2,
    createHash("sha256").update("a".repeat(64)).digest("hex"),
    payload,
  );
});
it("rejects cross-site orders without invoking the database", async () => {
  expect((await POST(request(payload, "https://evil.example"))).status).toBe(403);
  expect(sdk.place).not.toHaveBeenCalled();
});
it.each([{ total_pkr: 1 }, { customerId: "other" }, { paymentMethod: "card" }])(
  "rejects tampered business authority %s",
  async (extra) => {
    expect(
      (await POST(request({ ...payload, input: { ...payload.input, ...extra } }))).status,
    ).toBe(400);
    expect(sdk.place).not.toHaveBeenCalled();
  },
);
it("returns a recoverable stale quote code with private no-store headers", async () => {
  sdk.place.mockRejectedValue(new Error("quote_changed"));
  const r = await POST(request(payload));
  expect(r.status).toBe(409);
  expect((await r.json()).code).toBe("quote_changed");
  expect(r.headers.get("cache-control")).toContain("no-store");
});
it("maps order limits to 429 and hides provider details", async () => {
  sdk.place.mockRejectedValue(new Error("checkout_order_limit"));
  expect((await POST(request(payload))).status).toBe(429);
  sdk.place.mockRejectedValue(new Error("private database secret"));
  const r = await POST(request(payload));
  expect(r.status).toBe(503);
  expect(await r.text()).not.toContain("secret");
});
it("recovers only via the cookie-backed key and never takes an owner ID", async () => {
  const r = await GET(
    new NextRequest(
      `https://dwellune.vercel.app/api/checkout/orders?attempt=${payload.idempotencyKey}`,
      { headers: { cookie: `dwellune-guest-cart=${"c".repeat(64)}` } },
    ),
  );
  expect(r.status).toBe(200);
  expect(sdk.recover).toHaveBeenCalledWith(
    createHash("sha256").update("c".repeat(64)).digest("hex"),
    payload.idempotencyKey,
  );
});
it("rejects malformed recovery keys", async () => {
  expect(
    (await GET(new NextRequest("https://dwellune.vercel.app/api/checkout/orders?attempt=bad")))
      .status,
  ).toBe(400);
  expect(sdk.recover).not.toHaveBeenCalled();
});
