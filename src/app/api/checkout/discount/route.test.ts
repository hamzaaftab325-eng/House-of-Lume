import { expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
const sdk = vi.hoisted(() => ({ apply: vi.fn() }));
vi.mock("@/server/checkout/checkout.service", () => ({ applyCheckoutDiscount: sdk.apply }));
import { POST } from "./route";
const input = {
  address: {
    line1: "Test street 123",
    line2: "",
    city: "Lahore",
    province: "Punjab",
    postalCode: "54000",
    country: "PK",
  },
  code: "CITY",
};
function request(data: unknown, origin = "https://dwellune.vercel.app") {
  return new NextRequest("https://dwellune.vercel.app/api/checkout/discount", {
    method: "POST",
    headers: {
      origin,
      host: "dwellune.vercel.app",
      "content-type": "application/json",
      cookie: `dwellune-guest-cart=${"a".repeat(64)}`,
    },
    body: JSON.stringify(data),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  sdk.apply.mockResolvedValue({ revision: "b".repeat(64) });
});
it("applies a code using the validated delivery address rather than estimated bag shipping", async () => {
  expect((await POST(request(input))).status).toBe(200);
  expect(sdk.apply).toHaveBeenCalledWith(expect.any(String), input);
});
it("rejects missing geography, client totals and cross-origin application", async () => {
  expect(
    (await POST(request({ ...input, address: { ...input.address, country: "US" } }))).status,
  ).toBe(400);
  expect((await POST(request({ ...input, total_pkr: 1 }))).status).toBe(400);
  expect((await POST(request(input, "https://evil.example"))).status).toBe(403);
  expect(sdk.apply).not.toHaveBeenCalled();
});
