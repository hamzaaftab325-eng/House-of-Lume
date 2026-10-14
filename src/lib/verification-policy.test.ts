import { expect, it } from "vitest";
import {
  policyActionSchema,
  policySchema,
  reviewSchema,
  verificationInputSchema,
} from "./verification";
const policy = {
  revision: 0,
  verificationRequired: true,
  highValuePkr: 25000,
  duplicateWindowHours: 24,
  failedDeliveryCount: 2,
  failedDeliveryLookbackDays: 180,
  maxOrders24h: 5,
  maxOrdersHour: 3,
};
it("accepts bounded rules and enforces integer/cross-field limits", () => {
  expect(policySchema.safeParse(policy).success).toBe(true);
  for (const changes of [
    { highValuePkr: 999 },
    { duplicateWindowHours: 0 },
    { maxOrdersHour: 6 },
    { failedDeliveryCount: 11 },
    { failedDeliveryLookbackDays: 366 },
    { maxOrders24h: 1.5 },
  ])
    expect(policySchema.safeParse({ ...policy, ...changes }).success).toBe(false);
});
it("requires an audited rule-change reason and rejects gate/role overrides", () => {
  const { revision, ...values } = policy;
  const input = {
    requestId: "98000000-0000-4000-8000-000000000001",
    expectedRevision: revision,
    note: "Owner changed limits",
    values,
  };
  expect(policyActionSchema.safeParse(input).success).toBe(true);
  expect(policyActionSchema.safeParse({ ...input, note: " " }).success).toBe(false);
  expect(
    policyActionSchema.safeParse({ ...input, values: { ...values, role: "super_admin" } }).success,
  ).toBe(false);
});
it("validates explicit review actions with private notes", () => {
  for (const action of ["request_review", "clear_review"])
    expect(
      verificationInputSchema.safeParse({
        action,
        expectedRevision: 0,
        note: "Customer and order reviewed",
      }).success,
    ).toBe(true);
});
it("rejects invented review scores or unknown evidence codes", () => {
  expect(
    reviewSchema.safeParse({
      status: "pending",
      flags: [{ code: "ai_risk_score", label: "Claimed AI score", count: 99, threshold: 50 }],
      reviewed_by: null,
      reviewed_at: null,
      note: null,
    }).success,
  ).toBe(false);
});
