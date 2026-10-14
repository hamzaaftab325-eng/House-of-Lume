import { z } from "zod";

export function safeAccountRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value))
    return "/account";
  try {
    const url = new URL(value, "https://dwellune.vercel.app");
    if (url.origin !== "https://dwellune.vercel.app" || url.pathname.startsWith("/auth"))
      return "/account";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/account";
  }
}

export const notificationFilters = ["all", "unread", "orders", "returns", "account"] as const;
export type NotificationFilter = (typeof notificationFilters)[number];
export function notificationFilter(value?: string): NotificationFilter {
  return notificationFilters.find((filter) => filter === value) ?? "all";
}

const phone = z
  .string()
  .trim()
  .regex(/^\+?\d[\d ()-]{8,19}$/, "Enter a valid phone number.");
const optionalPhone = z.union([phone, z.literal("")]);
export const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: optionalPhone,
    whatsapp: optionalPhone,
  })
  .strict();
export const addressSchema = z
  .object({
    id: z.uuid().optional(),
    label: z.string().trim().max(50),
    recipient: z.string().trim().min(2).max(100),
    phone,
    line1: z.string().trim().min(5).max(200),
    line2: z.string().trim().max(200),
    city: z.string().trim().min(2).max(80),
    province: z.enum([
      "Punjab",
      "Sindh",
      "Khyber Pakhtunkhwa",
      "Balochistan",
      "Islamabad Capital Territory",
      "Gilgit-Baltistan",
      "Azad Jammu and Kashmir",
    ]),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{5}$|^$/, "Use a five-digit Pakistan postal code."),
    default: z.boolean(),
  })
  .strict();
export const preferencesSchema = z.object({ emailMarketing: z.boolean() }).strict();
export const accountActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("profile"), values: profileSchema }).strict(),
  z.object({ action: z.literal("address"), values: addressSchema }).strict(),
  z.object({ action: z.literal("deleteAddress"), id: z.uuid() }).strict(),
  z.object({ action: z.literal("readNotification"), id: z.uuid() }).strict(),
  z.object({ action: z.literal("readAllNotifications") }).strict(),
  z.object({ action: z.literal("preferences"), values: preferencesSchema }).strict(),
  z
    .object({
      action: z.literal("return"),
      requestId: z.uuid(),
      orderId: z.uuid(),
      reason: z.string().min(1).max(80),
      detail: z.string().trim().max(2000),
      items: z
        .array(z.object({ id: z.uuid(), quantity: z.number().int().min(1).max(99) }).strict())
        .min(1)
        .max(30),
    })
    .strict(),
]);
export type AccountAction = z.infer<typeof accountActionSchema>;
export const customerSchema = z.object({
  id: z.uuid(),
  full_name: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp_number: z.string().nullable(),
  status: z.literal("active"),
});
export const addressRowSchema = z.object({
  id: z.uuid(),
  label: z.string().nullable(),
  recipient_name: z.string(),
  phone: z.string(),
  address_line1: z.string(),
  address_line2: z.string().nullable(),
  city: z.string(),
  province: z.string(),
  postal_code: z.string().nullable(),
  is_default: z.boolean(),
});
export const orderSchema = z.object({
  id: z.uuid(),
  order_number: z.number(),
  status: z.string(),
  total_pkr: z.number(),
  subtotal_pkr: z.number(),
  discount_pkr: z.number(),
  shipping_pkr: z.number(),
  tax_pkr: z.number(),
  placed_at: z.string(),
  delivered_at: z.string().nullable(),
});
export const orderItemSchema = z.object({
  id: z.uuid(),
  product_id: z.uuid().nullable(),
  product_name: z.string(),
  variant_name: z.string(),
  quantity: z.number(),
  line_total_pkr: z.number(),
});
export const orderHistorySchema = z.object({
  id: z.number(),
  from_status: z.string().nullable(),
  to_status: z.string(),
  created_at: z.string(),
});
export const notificationSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  body: z.string(),
  priority: z.string(),
  read_at: z.string().nullable(),
  created_at: z.string(),
  entity_type: z.string().nullable(),
  entity_id: z.uuid().nullable(),
});
export const returnSchema = z.object({
  id: z.uuid(),
  order_id: z.uuid(),
  return_number: z.number(),
  status: z.string(),
  reason_code: z.string(),
  requested_at: z.string(),
});
export const returnPolicySchema = z.object({
  enabled: z.literal(true),
  window_days: z.number().int().min(1).max(365),
  reason_codes: z.array(z.string().min(1).max(80)).min(1).max(20),
  excluded_product_ids: z.array(z.uuid()),
  refund_procedure: z.string().min(10).max(2000),
});
export type Customer = z.infer<typeof customerSchema>;
export type Address = z.infer<typeof addressRowSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type CustomerReturn = z.infer<typeof returnSchema>;
export type ReturnPolicy = z.infer<typeof returnPolicySchema>;
