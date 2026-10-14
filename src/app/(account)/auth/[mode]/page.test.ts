import { beforeEach, expect, it, vi } from "vitest";
const identity = vi.hoisted(() => vi.fn());
vi.mock("@/server/account/account.service", () => ({ accountIdentity: identity }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
  notFound: () => {
    throw new Error("not-found");
  },
}));
import AuthPage from "./page";
beforeEach(() => vi.resetAllMocks());
it("sends signed-in visitors from signup to profile even with a saved destination", async () => {
  identity.mockResolvedValue({ customer: { id: "test" } });
  await expect(
    AuthPage({
      params: Promise.resolve({ mode: "signup" }),
      searchParams: Promise.resolve({ next: "/account/addresses" }),
    }),
  ).rejects.toThrow("redirect:/account");
});
it("preserves a safe sign-in destination for an existing session", async () => {
  identity.mockResolvedValue({ customer: { id: "test" } });
  await expect(
    AuthPage({
      params: Promise.resolve({ mode: "signin" }),
      searchParams: Promise.resolve({ next: "/wishlist" }),
    }),
  ).rejects.toThrow("redirect:/wishlist");
});
it("keeps the signup form available to a visitor without a valid session", async () => {
  identity.mockRejectedValue(new Error("authentication_required"));
  await expect(
    AuthPage({ params: Promise.resolve({ mode: "signup" }), searchParams: Promise.resolve({}) }),
  ).resolves.toBeDefined();
});
