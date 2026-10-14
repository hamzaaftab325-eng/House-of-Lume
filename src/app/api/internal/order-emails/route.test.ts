import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock("@/server/email/order-email.service", () => ({ runOrderEmails: mocks.run }));
import { POST } from "./route";
const secret = "a".repeat(64);
function request(token: string, body: unknown = { action: "dispatch" }) {
  return new NextRequest("https://dwellune.vercel.app/api/internal/order-emails", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ORDER_EMAIL_WORKER_SECRET", secret);
});
it.each(["", "a".repeat(63), "b".repeat(64), "é".repeat(64)])(
  "denies missing/wrong/Unicode capability without executing email work",
  async (token) => {
    expect((await POST(request(token))).status).toBe(401);
    expect(mocks.run).not.toHaveBeenCalled();
  },
);
it("does not permit caller-supplied recipients", async () => {
  expect((await POST(request(secret, { action: "test", to: "foreign@example.com" }))).status).toBe(
    400,
  );
  expect(mocks.run).not.toHaveBeenCalled();
});
it("returns no private SMTP error details", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mocks.run.mockRejectedValue(new Error("private credential/provider response"));
  const response = await POST(request(secret));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "Email worker requires attention." });
  vi.restoreAllMocks();
});
it("runs the authorized action and disables response caching", async () => {
  mocks.run.mockResolvedValue({ status: "idle" });
  const response = await POST(request(secret));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
