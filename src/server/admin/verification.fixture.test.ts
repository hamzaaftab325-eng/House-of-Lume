import { afterEach, expect, it, vi } from "vitest";
import { adminFixtureEnabled } from "./verification.fixture";
afterEach(() => vi.unstubAllEnvs());
it("cannot activate a staff bypass on Vercel, production hosts or real Supabase", () => {
  vi.stubEnv("COMMERCE_TEST_FIXTURES", "1");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://127.0.0.1:3000");
  vi.stubEnv("VERCEL", "");
  expect(adminFixtureEnabled()).toBe(true);
  vi.stubEnv("VERCEL", "1");
  expect(adminFixtureEnabled()).toBe(false);
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dwellune.vercel.app");
  expect(adminFixtureEnabled()).toBe(false);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://127.0.0.1:3000");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://hahlsfuxdyymrwinekjt.supabase.co");
  expect(adminFixtureEnabled()).toBe(false);
});
