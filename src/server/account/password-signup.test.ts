import { beforeEach, expect, it, vi } from "vitest";
const sdk = vi.hoisted(() => ({ signUp: vi.fn(), createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: sdk.createClient }));
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-public-key",
  },
}));
import { passwordSignUp } from "./password-signup";
beforeEach(() => {
  vi.resetAllMocks();
  sdk.createClient.mockReturnValue({ auth: { signUp: sdk.signUp } });
  sdk.signUp.mockResolvedValue({ data: { session: {} }, error: null });
});
it("uses a nonpersisting password client with no email callback", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ mailer_autoconfirm: true }))),
  );
  await passwordSignUp("test@example.invalid", "long-test-password", "Test customer");
  expect(sdk.createClient).toHaveBeenCalledWith("https://example.supabase.co", "test-public-key", {
    auth: {
      flowType: "implicit",
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  expect(sdk.signUp).toHaveBeenCalledWith({
    email: "test@example.invalid",
    password: "long-test-password",
    options: { data: { full_name: "Test customer" } },
  });
});
it.each([false, null, undefined])(
  "blocks signup before any email is sent when autoconfirm is %s",
  async (mailer_autoconfirm) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ mailer_autoconfirm }))),
    );
    await expect(
      passwordSignUp("test@example.invalid", "long-test-password", "Test customer"),
    ).rejects.toThrow("signup_confirmation_enabled");
    expect(sdk.signUp).not.toHaveBeenCalled();
  },
);
it("fails honestly if public Auth configuration cannot be read", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));
  await expect(
    passwordSignUp("test@example.invalid", "long-test-password", "Test customer"),
  ).rejects.toThrow("signup_configuration_unavailable");
  expect(sdk.signUp).not.toHaveBeenCalled();
});
