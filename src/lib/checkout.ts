import { z } from "zod";
import { addressSchema, addressRowSchema } from "./account";
import { cartSchema } from "./commerce";

export const provinces = addressSchema.shape.province.options;
export const deliveryAddressSchema = addressSchema
  .pick({ line1: true, line2: true, city: true, province: true, postalCode: true })
  .extend({ country: z.literal("PK") })
  .strict();
export const checkoutInputSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email().max(254),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/[ ()-]/g, ""))
      .pipe(
        z
          .string()
          .regex(
            /^(?:\+92|0092|92|0)3\d{9}$/,
            "Enter a Pakistan mobile number, such as 03001234567.",
          ),
      ),
    address: deliveryAddressSchema,
    savedAddressId: z.uuid().optional(),
    notes: z.string().trim().max(1000),
    terms: z.literal(true),
  })
  .strict();
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
export const checkoutContextSchema = z.object({
  ordersEnabled: z.boolean().default(false),
  authenticated: z.boolean(),
  email: z.string(),
  name: z.string(),
  phone: z.string(),
  addresses: z.array(addressRowSchema),
  returnPolicy: z.string().nullable(),
});
export type CheckoutContext = z.infer<typeof checkoutContextSchema>;
export const checkoutQuoteSchema = z.object({
  cart: cartSchema,
  revision: z.string().regex(/^[a-f0-9]{64}$/),
  quoted_at: z.string(),
  expires_at: z.string(),
  delivery: z.object({
    rule_id: z.uuid().optional(),
    name: z.string(),
    zone: z.string(),
    surcharge_pkr: z.number().int().nonnegative(),
    cod_min_pkr: z.number().int().nonnegative(),
    cod_max_pkr: z.number().int().nonnegative().nullable(),
  }),
  needs_stock_revalidation: z.boolean(),
  contains_test_product: z.boolean(),
});
export type CheckoutQuote = z.infer<typeof checkoutQuoteSchema>;
export function checkoutError(code: string) {
  const errors: Record<string, string> = {
    discount_not_found: "This discount code was not found.",
    checkout_not_open: "Order placement is awaiting store configuration. Your bag is saved.",
    quote_changed: "Your bag, price or delivery details changed. Review checkout again.",
    checkout_order_limit: "The daily COD order limit has been reached. Please contact support.",
    idempotency_conflict:
      "This attempt has different details. Review checkout before trying again.",
    test_product_not_orderable: "Demonstration products cannot be ordered for delivery.",
    order_unavailable: "This order is unavailable in your current session.",
    empty_cart: "Your bag is empty. Add an item before reviewing checkout.",
    delivery_area_unsupported:
      "Delivery is not configured for this address. Please check your city and province.",
    cod_not_eligible: "This order is outside the configured Cash on Delivery limits.",
    insufficient_stock: "Stock has changed. Update your bag and review checkout again.",
    variant_unavailable: "An item is no longer available. Refresh your bag before continuing.",
    discount_not_eligible: "Your discount no longer applies. Remove it or choose another code.",
    authentication_required:
      "Your session has ended. Sign in again, or sign out to use guest checkout.",
    guest_checkout_disabled: "Guest checkout is currently unavailable. Please sign in.",
    guest_cart_token_required: "Your bag session is not ready. Reload your bag and try again.",
    saved_address_unavailable:
      "That saved address is unavailable. Select another address or enter a new one.",
    invalid_delivery_address: "Please check your Pakistan delivery address.",
    checkout_item_limit: "Your bag exceeds the checkout item limit.",
  };
  return errors[code] ?? "We could not review checkout. Your bag is unchanged; please try again.";
}

export const placeOrderSchema = z
  .object({
    input: checkoutInputSchema,
    idempotencyKey: z.uuid(),
    revision: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export const orderConfirmationSchema = z.object({
  id: z.uuid(),
  order_number: z.number().int().positive(),
  authenticated: z.boolean(),
  status: z.string(),
  verification_status: z.string(),
  payment_method: z.literal("cash_on_delivery"),
  placed_at: z.string(),
  subtotal_pkr: z.number().int().nonnegative(),
  discount_pkr: z.number().int().nonnegative(),
  shipping_pkr: z.number().int().nonnegative(),
  tax_pkr: z.number().int().nonnegative(),
  total_pkr: z.number().int().nonnegative(),
  email_status: z.enum(["pending", "sending", "sent", "failed"]),
  lines: z.array(
    z.object({
      name: z.string(),
      variant: z.string(),
      quantity: z.number().int().positive(),
      unit_price_pkr: z.number().int().nonnegative(),
      line_total_pkr: z.number().int().nonnegative(),
    }),
  ),
});

export const checkoutDiscountSchema = z
  .object({
    address: deliveryAddressSchema,
    savedAddressId: z.uuid().optional(),
    code: z.string().trim().max(80),
  })
  .strict();
export type CheckoutDiscountInput = z.infer<typeof checkoutDiscountSchema>;
