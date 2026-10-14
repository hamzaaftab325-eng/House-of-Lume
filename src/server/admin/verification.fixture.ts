// Local browser-test adapter only. Never active on Vercel or against a real database.
import { cookies } from "next/headers";
import { z } from "zod";
import {
  verificationDetailSchema,
  verificationQueueSchema,
  type QueueFilter,
  type VerificationAction,
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
      .filter((entry) => entry.action !== "contact")
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
    detail.order.status === (filter === "pending" ? "pending_verification" : filter);
  return verificationQueueSchema.parse({
    items: show ? [{ ...detail.order, city: "Lahore" }] : [],
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
