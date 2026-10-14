import { z } from "zod";
export const queueFilters = ["pending", "confirmed", "cancelled", "all"] as const;
export const queueFilterSchema = z.enum(queueFilters);
export type QueueFilter = z.infer<typeof queueFilterSchema>;
const revision = z.number().int().min(0).max(9_999_999_999);
const note = z
  .string()
  .trim()
  .min(3, "Add at least three characters explaining this action.")
  .max(2000);
export const verificationInputSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("contact"),
      expectedRevision: revision,
      note,
      channel: z.enum(["phone", "whatsapp", "email", "admin"]),
      outcome: z.enum(["reached", "no_response", "failed"]),
    })
    .strict(),
  z
    .object({ action: z.enum(["confirm", "reject", "cancel"]), expectedRevision: revision, note })
    .strict(),
]);
export const verificationActionSchema = z
  .object({ orderId: z.uuid(), requestId: z.uuid(), input: verificationInputSchema })
  .strict();
export type VerificationAction = z.infer<typeof verificationActionSchema>;
const nullableText = z.string().nullable();
const status = z.string();
const summary = z.object({
  id: z.uuid(),
  order_number: z.number().int(),
  contact_name: z.string(),
  contact_phone: z.string(),
  status,
  verification_status: status,
  total_pkr: z.number().int().nonnegative(),
  placed_at: z.iso.datetime({ offset: true }),
});
export const verificationQueueSchema = z.object({
  items: z.array(summary.extend({ city: nullableText })),
  next_cursor: z.uuid().nullable(),
});
export const verificationDetailSchema = z.object({
  order: summary.extend({
    contact_email: nullableText,
    contact_whatsapp: nullableText,
    verification_revision: revision,
    subtotal_pkr: z.number(),
    discount_pkr: z.number(),
    shipping_pkr: z.number(),
    tax_pkr: z.number(),
    customer_note: nullableText,
    confirmed_at: nullableText,
    cancelled_at: nullableText,
    cod_settlement_status: z.string(),
  }),
  items: z.array(
    z.object({
      id: z.uuid(),
      product_name: z.string(),
      variant_name: z.string(),
      sku: z.string(),
      quantity: z.number().int().positive(),
      line_total_pkr: z.number(),
    }),
  ),
  address: z
    .object({
      recipient_name: z.string(),
      phone: z.string(),
      line1: z.string(),
      line2: nullableText,
      city: z.string(),
      province: z.string(),
      postal_code: nullableText,
    })
    .nullable(),
  attempts: z.array(
    z.object({
      id: z.uuid(),
      attempt_number: z.number().int(),
      method: z.string(),
      status: z.string(),
      contact_channel: nullableText,
      contact_outcome: nullableText,
      staff_action: nullableText,
      note: nullableText,
      initiated_by: nullableText,
      verified_by: nullableText,
      created_at: z.string(),
      verified_at: nullableText,
      staff_name: nullableText,
    }),
  ),
  history: z.array(
    z.object({
      id: z.number(),
      from_status: nullableText,
      to_status: z.string(),
      changed_by: nullableText,
      created_at: z.string(),
    }),
  ),
  can_verify: z.boolean(),
  can_cancel: z.boolean(),
});
export const verificationResultSchema = z.object({
  id: z.uuid(),
  status: z.string(),
  verification_status: z.string(),
  verification_revision: revision,
});
export type VerificationDetail = z.infer<typeof verificationDetailSchema>;
export function verificationError(code: string) {
  const messages: Record<string, string> = {
    authentication_required: "Your session expired. Sign in again.",
    staff_access_required: "Administrator access is required.",
    order_unavailable: "This order is unavailable.",
    verification_changed:
      "Another action changed this order. Reload its details before continuing.",
    verification_idempotency_conflict:
      "This attempt conflicts with an earlier request. Reload the order to review its status.",
    verification_transition_invalid: "This order can no longer be verified. Reload its details.",
    cancellation_unavailable:
      "This order has moved beyond this cancellation workflow. Review its fulfillment and settlement first.",
    verification_attempt_limit: "This order has reached the verification attempt limit.",
    invalid_verification_input: "Check the action and add a verification note.",
  };
  return (
    messages[code] ??
    "We could not confirm whether the action was saved. Retry the same attempt or reload the order."
  );
}
export function staffContactLinks(
  phone: string,
  whatsapp: string | null,
  email: string | null,
  orderNumber: number,
) {
  const safePhone = /^\+?\d{8,15}$/.test(phone) ? phone : null;
  const wa = whatsapp || phone;
  const safeWa = /^\+?\d{8,15}$/.test(wa) ? wa.replace(/^\+/, "") : null;
  const safeEmail = email && z.email().safeParse(email).success ? email : null;
  return {
    phone: safePhone ? `tel:${safePhone}` : null,
    whatsapp: safeWa ? `https://wa.me/${safeWa}` : null,
    email: safeEmail
      ? `mailto:${encodeURIComponent(safeEmail)}?subject=${encodeURIComponent(`DWELLUNE order ${orderNumber} verification`)}`
      : null,
  };
}
export function verificationMoney(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}
export function verificationDate(value: string) {
  return new Date(value).toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
}
