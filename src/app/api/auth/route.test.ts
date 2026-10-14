import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
  setSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  resend: vi.fn(),
  getUser: vi.fn(),
  getClaims: vi.fn(),
  updateUser: vi.fn(),
  reauthenticate: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth, rpc: auth.rpc }) }));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_SITE_URL: "https://dwellune.vercel.app" } }));
vi.mock("@/server/account/password-signup", () => ({ passwordSignUp: auth.signUp }));
import { POST } from "./route";
function request(body: unknown, origin = "https://dwellune.vercel.app") {
  return new NextRequest("https://dwellune.vercel.app/api/auth", {
    method: "POST",
    headers: { origin, host: "dwellune.vercel.app", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("AUTH_EMAIL_READY", "true");
  for (const method of [
    auth.signUp,
    auth.setSession,
    auth.signInWithPassword,
    auth.signOut,
    auth.resetPasswordForEmail,
    auth.resend,
    auth.updateUser,
    auth.reauthenticate,
  ])
    method.mockResolvedValue({ data: {}, error: null });
  auth.signUp.mockResolvedValue({
    data: { session: { access_token: "test-access", refresh_token: "test-refresh" } },
    error: null,
  });
  auth.getUser.mockResolvedValue({
    data: { user: { id: "77000000-0000-4000-8000-000000000001", email: "test@example.invalid" } },
    error: null,
  });
  auth.rpc.mockResolvedValue({ data: true, error: null });
});
describe("account Auth route", () => {
  it("rejects a foreign origin before touching Auth", async () => {
    const response = await POST(
      request(
        { action: "signin", email: "test@example.invalid", password: "test" },
        "https://evil.example",
      ),
    );
    expect(response.status).toBe(403);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });
  it("starts a signup session without returning tokens or depending on email delivery", async () => {
    vi.stubEnv("AUTH_EMAIL_READY", "false");
    expect(
      (
        await POST(
          request({
            action: "signup",
            name: "Test customer",
            email: "test@example.invalid",
            password: "a-long-test-password",
          }),
        )
      ).status,
    ).toBe(200);
    expect(auth.signUp).toHaveBeenCalledWith(
      "test@example.invalid",
      "a-long-test-password",
      "Test customer",
    );
    expect(auth.setSession).toHaveBeenCalledWith({
      access_token: "test-access",
      refresh_token: "test-refresh",
    });
  });
  it("does not send a verification email when provider confirmation is still enabled", async () => {
    auth.signUp.mockRejectedValue(new Error("signup_confirmation_enabled"));
    const r = await POST(
      request({
        action: "signup",
        name: "Test customer",
        email: "test@example.invalid",
        password: "a-long-test-password",
      }),
    );
    expect(r.status).toBe(503);
    expect(auth.setSession).not.toHaveBeenCalled();
  });
  it("does not claim signup success without a real session", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const r = await POST(
      request({
        action: "signup",
        name: "Test customer",
        email: "test@example.invalid",
        password: "a-long-test-password",
      }),
    );
    expect(r.status).toBe(409);
    expect(auth.setSession).not.toHaveBeenCalled();
  });
  it("returns only a success flag after installing the session", async () => {
    const r = await POST(
      request({
        action: "signup",
        name: "Test customer",
        email: "test@example.invalid",
        password: "a-long-test-password",
      }),
    );
    const data = await r.json();
    expect(data.authenticated).toBe(true);
    expect(JSON.stringify(data)).not.toContain("test-access");
    expect(JSON.stringify(data)).not.toContain("test-refresh");
  });
  it("keeps email-dependent actions closed until delivery is verified", async () => {
    vi.stubEnv("AUTH_EMAIL_READY", "false");
    expect((await POST(request({ action: "reset", email: "test@example.invalid" }))).status).toBe(
      503,
    );
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });
  it("does not expose provider errors or account existence on login", async () => {
    auth.signInWithPassword.mockResolvedValue({
      error: { message: "secret provider detail", status: 400 },
    });
    const response = await POST(
      request({ action: "signin", email: "test@example.invalid", password: "incorrect" }),
    );
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain("secret provider detail");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("requests recovery with the dedicated callback flag", async () => {
    expect((await POST(request({ action: "reset", email: "test@example.invalid" }))).status).toBe(
      200,
    );
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.invalid", {
      redirectTo: "https://dwellune.vercel.app/auth/callback?flow=recovery",
    });
  });
  it("rejects mismatched passwords without changing the session", async () => {
    expect(
      (
        await POST(
          request({
            action: "password",
            currentPassword: "old-password",
            password: "a-long-test-password",
            confirm: "a-different-password",
          }),
        )
      ).status,
    ).toBe(400);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("requires current password and revokes other sessions after changing it", async () => {
    expect(
      (
        await POST(
          request({
            action: "password",
            currentPassword: "old-password",
            password: "a-long-test-password",
            confirm: "a-long-test-password",
          }),
        )
      ).status,
    ).toBe(200);
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.invalid",
      password: "old-password",
    });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "a-long-test-password" });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "others" });
  });
  it("reports a failed session revocation instead of claiming full success", async () => {
    auth.signOut.mockResolvedValue({ error: { status: 500 } });
    const response = await POST(
      request({
        action: "password",
        currentPassword: "old-password",
        password: "a-long-test-password",
        confirm: "a-long-test-password",
      }),
    );
    expect(response.status).toBe(502);
    expect((await response.json()).error).toContain("password changed");
  });
  it("denies writes with a revoked live session", async () => {
    auth.rpc.mockResolvedValue({ data: false, error: null });
    expect(
      (
        await POST(
          request({
            action: "email",
            currentPassword: "old-password",
            email: "other@example.invalid",
          }),
        )
      ).status,
    ).toBe(401);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("denies recovery without a session-bound signed grant", async () => {
    auth.getClaims.mockResolvedValue({
      data: { claims: { session_id: "77100000-0000-4000-8000-000000000001" } },
    });
    expect(
      (
        await POST(
          request({
            action: "recover",
            password: "a-long-test-password",
            confirm: "a-long-test-password",
          }),
        )
      ).status,
    ).toBe(401);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("signs out all devices and clears the recovery grant", async () => {
    const response = await POST(request({ action: "signout" }));
    expect(response.status).toBe(200);
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(response.cookies.get("dwellune-recovery")?.value).toBe("");
  });
});
