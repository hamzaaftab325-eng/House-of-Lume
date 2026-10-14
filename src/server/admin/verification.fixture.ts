// Local browser-test adapter only. Never active on Vercel or against a real database.
import { cookies } from "next/headers";
import { z } from "zod";
import {
  verificationDetailSchema,
  verificationQueueSchema,
  type QueueFilter,
  type VerificationAction,
  reviewSchema,
  policySchema,
  type PolicyAction,
} from "@/lib/verification";
export const fixtureOrderId = "94000000-0000-4000-8000-000000000001";
const fixtureStaffId = "94000000-0000-4000-8000-000000000002";
export function staffFixtureEnabled() {
  return (
    !process.env.VERCEL &&
    process.env.COMMERCE_TEST_FIXTURES === "1" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === "https://example.supabase.co" &&
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(process.env.NEXT_PUBLIC_SITE_URL ?? "")
  );
}
export async function staffFixtureIdentity() {
  if ((await cookies()).get("dwellune-test-staff")?.value !== "1")
    throw new Error("authentication_required");
  return { email: "staff-fixture@example.invalid", customerId: fixtureStaffId };
}
const stateSchema = z.object({
  review: reviewSchema.default({
    status: "not_required",
    flags: [],
    reviewed_by: null,
    reviewed_at: null,
    note: null,
  }),
  revision: z.number().int(),
  status: z.enum(["pending_verification", "confirmed", "cancelled"]),
  verification: z.enum(["pending", "admin_approved", "rejected"]),
  notes: z.array(
    z.object({
      action: z.string(),
      note: z.string(),
      channel: z.string().optional(),
      outcome: z.string().optional(),
    }),
  ),
  lastRequest: z.string().optional(),
  lastInput: z.string().optional(),
});
async function readState() {
  const raw = (await cookies()).get("dwellune-test-verification")?.value;
  try {
    return stateSchema.parse(JSON.parse(raw ?? ""));
  } catch {
    return stateSchema.parse({
      revision: 0,
      status: "pending_verification",
      verification: "pending",
      notes: [],
    });
  }
}
export async function fixtureDetail(id: string) {
  if (id !== fixtureOrderId) throw new Error("order_unavailable");
  const state = await readState();
  const date = "2026-10-14T00:00:00+00:00";
  return verificationDetailSchema.parse({
    review: state.review,
    order: {
      id,
      order_number: 900001,
      contact_name: "Verification fixture customer",
      contact_phone: "+923001234567",
      contact_email: "fixture@example.invalid",
      contact_whatsapp: null,
      status: state.status,
      verification_status: state.verification,
      verification_revision: state.revision,
      total_pkr: 2200,
      subtotal_pkr: 2000,
      discount_pkr: 0,
      shipping_pkr: 200,
      tax_pkr: 0,
      customer_note: null,
      placed_at: date,
      confirmed_at: state.status === "confirmed" ? date : null,
      cancelled_at: state.status === "cancelled" ? date : null,
      cod_settlement_status: "not_due",
    },
    address: {
      recipient_name: "Fixture customer",
      phone: "+923001234567",
      line1: "123 Fixture Street",
      line2: null,
      city: "Lahore",
      province: "Punjab",
      postal_code: "54000",
    },
    items: [
      {
        id: "94000000-0000-4000-8000-000000000003",
        product_name: "Fixture lamp",
        variant_name: "Standard",
        sku: "FIXTURE-LAMP",
        quantity: 2,
        line_total_pkr: 2000,
      },
    ],
    attempts: state.notes
      .map((entry, index) => ({
        id: `94000000-0000-4000-8000-${String(index + 10).padStart(12, "0")}`,
        attempt_number: index + 1,
        method: "admin",
        status: state.verification,
        contact_channel: entry.channel ?? "admin",
        contact_outcome: entry.outcome ?? null,
        staff_action: entry.action,
        note: entry.note,
        initiated_by: fixtureStaffId,
        verified_by: entry.action === "confirm" ? fixtureStaffId : null,
        created_at: date,
        verified_at: entry.action === "confirm" ? date : null,
        staff_name: "Fixture staff",
      }))
      .reverse(),
    history: state.notes
      .filter((entry) => ["confirm", "reject", "cancel"].includes(entry.action))
      .map((entry, index) => ({
        id: index + 1,
        from_status: "pending_verification",
        to_status: entry.action === "confirm" ? "confirmed" : "cancelled",
        changed_by: fixtureStaffId,
        created_at: date,
      })),
    can_verify: state.status === "pending_verification",
    can_cancel: state.status !== "cancelled",
  });
}
export async function fixtureQueue(filter: QueueFilter) {
  const detail = await fixtureDetail(fixtureOrderId);
  const show =
    filter === "all" ||
    (filter === "review" && detail.review.status === "pending") ||
    detail.order.status === (filter === "pending" ? "pending_verification" : filter);
  return verificationQueueSchema.parse({
    items: show
      ? [
          {
            ...detail.order,
            city: "Lahore",
            review_status: detail.review.status,
            review_flag_count: detail.review.flags.length,
          },
        ]
      : [],
    next_cursor: null,
  });
}
export async function fixtureAction(action: VerificationAction) {
  const detail = await fixtureDetail(action.orderId);
  const state = await readState();
  const input = JSON.stringify(action.input);
  if (state.lastRequest === action.requestId) {
    if (state.lastInput !== input) throw new Error("verification_idempotency_conflict");
    return {
      id: action.orderId,
      status: state.status,
      verification_status: state.verification,
      verification_revision: state.revision,
    };
  }
  if (action.input.expectedRevision !== state.revision) throw new Error("verification_changed");
  if (action.input.action === "confirm" && state.review.status === "pending")
    throw new Error("manual_review_required");
  if (action.input.action === "clear_review" && state.review.status !== "pending")
    throw new Error("verification_transition_invalid");
  if (!detail.can_cancel || (action.input.action !== "cancel" && !detail.can_verify))
    throw new Error("verification_transition_invalid");
  state.status =
    action.input.action === "confirm"
      ? "confirmed"
      : ["reject", "cancel"].includes(action.input.action)
        ? "cancelled"
        : state.status;
  state.verification =
    action.input.action === "confirm"
      ? "admin_approved"
      : action.input.action === "reject"
        ? "rejected"
        : state.verification;
  state.revision++;
  if (action.input.action === "request_review")
    state.review = {
      status: "pending",
      flags: state.review.flags.some((flag) => flag.code === "staff_review")
        ? state.review.flags
        : [
            ...state.review.flags,
            {
              code: "staff_review",
              label: "Staff requested manual review.",
              count: 1,
              threshold: 1,
            },
          ],
      reviewed_at: null,
      reviewed_by: null,
      note: action.input.note,
    };
  if (action.input.action === "clear_review")
    state.review = {
      ...state.review,
      status: "cleared",
      reviewed_by: fixtureStaffId,
      reviewed_at: "2026-10-14T00:00:00+00:00",
      note: action.input.note,
    };
  if (state.status === "cancelled" && state.review.status === "pending")
    state.review.status = "closed";
  state.notes.push(action.input);
  state.lastRequest = action.requestId;
  state.lastInput = input;
  (await cookies()).set("dwellune-test-verification", JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });
  return {
    id: action.orderId,
    status: state.status,
    verification_status: state.verification,
    verification_revision: state.revision,
  };
}

export async function fixturePolicy(action?: PolicyAction) {
  const store = await cookies();
  const defaults = {
    revision: 0,
    verificationRequired: true,
    highValuePkr: 25000,
    duplicateWindowHours: 24,
    failedDeliveryCount: 2,
    failedDeliveryLookbackDays: 180,
    maxOrders24h: 5,
    maxOrdersHour: 3,
  };
  let policy = policySchema.parse(defaults);
  try {
    policy = policySchema.parse(JSON.parse(store.get("dwellune-test-policy")?.value ?? ""));
  } catch {
    /* Initial fixture policy. */
  }
  if (!action) return policy;
  const input = JSON.stringify(action);
  if (store.get("dwellune-test-policy-request")?.value === action.requestId) {
    if (store.get("dwellune-test-policy-input")?.value !== input)
      throw new Error("verification_idempotency_conflict");
    return policy;
  }
  if (action.expectedRevision !== policy.revision) throw new Error("verification_changed");
  const next = policySchema.parse({ ...action.values, revision: policy.revision + 1 });
  const options = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 3600 };
  store.set("dwellune-test-policy", JSON.stringify(next), options);
  store.set("dwellune-test-policy-request", action.requestId, options);
  store.set("dwellune-test-policy-input", input, options);
  return next;
}
