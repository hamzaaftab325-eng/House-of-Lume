import { z } from "zod";
export const queueFilters = ["pending", "review", "confirmed", "cancelled", "all"] as const;
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
    .object({
      action: z.enum(["confirm", "reject", "cancel", "request_review", "clear_review"]),
      expectedRevision: revision,
      note,
    })
    .strict(),
]);
export const verificationActionSchema = z
  .object({ orderId: z.uuid(), requestId: z.uuid(), input: verificationInputSchema })
  .strict();
export type VerificationAction = z.infer<typeof verificationActionSchema>;
export const reviewStatusSchema = z.enum(["not_required", "pending", "cleared", "closed"]);
export const reviewFlagSchema = z.object({
  code: z.enum(["high_value", "possible_duplicate", "failed_delivery_history", "staff_review"]),
  label: z.string().max(200),
  count: z.number().int().nonnegative(),
  threshold: z.number().int().positive(),
  window: z.number().int().positive().optional(),
});
export const reviewSchema = z.object({
  status: reviewStatusSchema,
  flags: z.array(reviewFlagSchema).max(4),
  reviewed_by: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  note: z.string().nullable(),
});
export const policyValuesSchema = z
  .object({
    verificationRequired: z.boolean(),
    highValuePkr: z.number().int().min(1000).max(1_000_000),
    duplicateWindowHours: z.number().int().min(1).max(72),
    failedDeliveryCount: z.number().int().min(1).max(10),
    failedDeliveryLookbackDays: z.number().int().min(1).max(365),
    maxOrders24h: z.number().int().min(1).max(20),
    maxOrdersHour: z.number().int().min(1).max(10),
  })
  .strict()
  .refine((values) => values.maxOrdersHour <= values.maxOrders24h, {
    message: "The hourly limit must not exceed the 24-hour limit.",
    path: ["maxOrdersHour"],
  });
export const policySchema = policyValuesSchema.safeExtend({ revision });
export const policyActionSchema = z
  .object({
    requestId: z.uuid(),
    expectedRevision: revision,
    note: z.string().trim().min(3).max(1000),
    values: policyValuesSchema,
  })
  .strict();
export type VerificationPolicy = z.infer<typeof policySchema>;
export type PolicyAction = z.infer<typeof policyActionSchema>;
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
  items: z.array(
    summary.extend({
      city: nullableText,
      review_status: reviewStatusSchema.default("not_required"),
      review_flag_count: z.number().int().min(0).default(0),
    }),
  ),
  next_cursor: z.uuid().nullable(),
});
export const verificationDetailSchema = z.object({
  review: reviewSchema.default({
    status: "not_required",
    flags: [],
    reviewed_by: null,
    reviewed_at: null,
    note: null,
  }),
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
    admin_access_required: "Administrator access is required.",
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
    manual_review_required:
      "Clear the recorded manual review with a note before confirming this order.",
    invalid_verification_policy: "Check the rule values and limits before saving.",
  };
  return (
    messages[code] ??
    "We could not confirm whether the action was saved. Retry the same attempt or reload the order."
  );
}
export function adminContactLinks(
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
