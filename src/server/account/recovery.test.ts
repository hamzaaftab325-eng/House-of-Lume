import { afterEach, expect, it, vi } from "vitest";
import { signRecoveryGrant, verifyRecoveryGrant } from "./recovery";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
it("recovery grants are signed, short-lived and bound to the verified user and session", () => {
  vi.stubEnv("AUTH_RECOVERY_SECRET", "x".repeat(64));
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-13T00:00:00Z"));
  const token = signRecoveryGrant("user-one", "session-one");
  expect(verifyRecoveryGrant(token, "user-one", "session-one")).toBe(true);
  expect(verifyRecoveryGrant(token, "user-two", "session-one")).toBe(false);
  expect(verifyRecoveryGrant(token, "user-one", "session-two")).toBe(false);
  expect(verifyRecoveryGrant(token + "altered", "user-one", "session-one")).toBe(false);
  expect(verifyRecoveryGrant("unsigned", "user-one", "session-one")).toBe(false);
  vi.advanceTimersByTime(600001);
  expect(verifyRecoveryGrant(token, "user-one", "session-one")).toBe(false);
});
