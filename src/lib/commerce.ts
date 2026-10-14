import { productMediaUrl } from "./product-media";
import { z } from "zod";

const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const savedLineSchema = z.object({
  variant_id: z.uuid(),
  product_slug: z.string().regex(/^[a-z0-9-]+$/),
  product_name: z.string(),
  variant_title: z.string(),
  unit_price_pkr: money,
  media_path: z.string().nullable(),
  max_quantity: z.number().int().min(0).max(99).default(99),
});
export const cartLineSchema = savedLineSchema.extend({
  quantity: z.number().int().min(1).max(99),
  line_total_pkr: money,
  track_inventory: z.boolean(),
  reserved_quantity: z.number().int().nonnegative(),
  stock_state: z.enum(["available", "reserved", "revalidation_required", "unavailable"]),
  reservation_expires_at: z.string().nullable(),
});
export const cartSchema = z.object({
  cart_id: z.uuid().nullable(),
  authenticated: z.boolean(),
  lines: z.array(cartLineSchema),
  item_count: z.number().int().nonnegative(),
  reservation_minutes: z.number().int().positive(),
  quote: z.object({
    subtotal_pkr: money,
    discount_pkr: money,
    shipping_pkr: money,
    total_pkr: money,
    discount_code: z.string().nullable(),
    discount_name: z.string().nullable(),
    discount_error: z.string().nullable(),
    cod_eligible: z.boolean(),
    estimated_days_min: z.number().int().nonnegative(),
    estimated_days_max: z.number().int().nonnegative(),
    free_shipping_threshold_pkr: money.nullable(),
    flat_fee_pkr: money,
  }),
});
export type Cart = z.infer<typeof cartSchema>;
export type CartLine = z.infer<typeof cartLineSchema>;
export type SavedLine = z.infer<typeof savedLineSchema>;
export const commerceResponseSchema = z.object({
  cart: cartSchema,
  wishlist: z.array(savedLineSchema),
});
export type CommerceResponse = z.infer<typeof commerceResponseSchema>;

const variantId = z.uuid();
export const commerceActionSchema = z.discriminatedUnion("action", [
  z
    .object({ action: z.literal("add"), variantId, quantity: z.number().int().min(1).max(99) })
    .strict(),
  z
    .object({ action: z.literal("quantity"), variantId, quantity: z.number().int().min(0).max(99) })
    .strict(),
  z.object({ action: z.literal("discount"), code: z.string().trim().max(80) }).strict(),
  z.object({ action: z.literal("save"), variantId, saved: z.boolean() }).strict(),
  z.object({ action: z.literal("move"), variantId }).strict(),
  z.object({ action: z.literal("sync"), savedIds: z.array(variantId).max(50) }).strict(),
  z
    .object({
      action: z.literal("import"),
      importId: z.uuid(),
      lines: z
        .array(z.object({ variantId, quantity: z.number().int().min(1).max(99) }).strict())
        .max(30),
    })
    .strict(),
]);
export type CommerceAction = z.infer<typeof commerceActionSchema>;

export function mediaUrl(path: string | null) {
  return productMediaUrl(path);
}

export function savedIdsFromStorage(raw: string | null): string[] {
  try {
    const values: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(values)) return [];
    return [...new Set(values.filter((v): v is string => variantId.safeParse(v).success))].slice(
      0,
      50,
    );
  } catch {
    return [];
  }
}

export function commerceError(message: string): string {
  if (message.includes("insufficient_stock"))
    return "There is not enough stock for that quantity. Refresh your bag and choose fewer items.";
  if (message.includes("variant_unavailable"))
    return "This selection is no longer available. You can remove it from your bag.";
  if (message.includes("discount") || message.includes("Discount"))
    return "That discount is invalid or does not apply to this bag.";
  if (message.includes("customer_unavailable") || message.includes("authentication_required"))
    return "Your account is unavailable. Please sign in again or contact support.";
  if (message.includes("too_many"))
    return "Your selection has reached its item limit. Remove an item before adding another.";
  return "We could not update your selection. Please retry. Your previous selection is unchanged.";
}

export function sameOrigin(origin: string | null, host: string, protocol: string): boolean {
  try {
    return (
      origin !== null &&
      new URL(origin).origin === `${protocol}//${host}` &&
      origin === new URL(origin).origin
    );
  } catch {
    return false;
  }
}
