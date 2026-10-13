// Local/CI adapter only. Production always uses the real Supabase RPCs.
import { cookies } from "next/headers";
import {
  cartSchema,
  type CommerceAction,
  type CommerceResponse,
  type SavedLine,
} from "@/lib/commerce";
import { getProductDetailFixture } from "@/server/catalogue/product-detail.fixture";

type FixtureState = { lines: Record<string, number>; code: string | null; imports: string[] };
function catalogue(): SavedLine[] {
  return ["test-aurelia-floor-lamp", "test-sable-planter"].flatMap((slug) => {
    const product = getProductDetailFixture(slug)?.product;
    return product
      ? product.variants.map((v) => ({
          variant_id: v.id,
          product_slug: product.slug,
          product_name: product.name,
          variant_title: v.title,
          unit_price_pkr: v.pricePkr,
          media_path: product.media[0]?.url ?? null,
          max_quantity: v.availableQuantity ?? 99,
        }))
      : [];
  });
}
export async function commerceFixture(
  savedIds: string[],
  action?: CommerceAction,
): Promise<CommerceResponse> {
  const store = await cookies();
  let state: FixtureState = { lines: {}, code: null, imports: [] };
  try {
    state = JSON.parse(store.get("dwellune-test-cart")?.value ?? "null") ?? state;
  } catch {
    /* Empty fixture. */
  }
  const products = catalogue();
  const setQuantity = (id: string, quantity: number, add = false) => {
    const product = products.find((p) => p.variant_id === id);
    if (!product) throw new Error("variant_unavailable");
    const desired = add ? (state.lines[id] ?? 0) + quantity : quantity;
    if (desired > product.max_quantity) throw new Error("insufficient_stock");
    if (desired === 0) delete state.lines[id];
    else state.lines[id] = desired;
  };
  switch (action?.action) {
    case "add":
      setQuantity(action.variantId, action.quantity, true);
      break;
    case "quantity":
      setQuantity(action.variantId, action.quantity);
      break;
    case "move":
      setQuantity(action.variantId, 1, true);
      break;
    case "discount":
      if (action.code && action.code !== "TEST10") throw new Error("discount_not_found");
      state.code = action.code || null;
      break;
    case "import":
      if (!state.imports.includes(action.importId)) {
        for (const line of action.lines) setQuantity(line.variantId, line.quantity, true);
        state.imports.push(action.importId);
      }
      break;
  }
  const lines = Object.entries(state.lines).flatMap(([id, quantity]) => {
    const p = products.find((p) => p.variant_id === id);
    return p
      ? [
          {
            ...p,
            quantity,
            line_total_pkr: p.unit_price_pkr * quantity,
            track_inventory: p.max_quantity !== 99,
            reserved_quantity: p.max_quantity !== 99 ? quantity : 0,
            stock_state: p.max_quantity !== 99 ? "reserved" : "available",
            reservation_expires_at:
              p.max_quantity !== 99 ? new Date(Date.now() + 1800000).toISOString() : null,
          },
        ]
      : [];
  });
  const subtotal = lines.reduce((sum, line) => sum + line.line_total_pkr, 0);
  const discount = state.code ? Math.floor(subtotal / 10) : 0;
  const shipping = !subtotal || subtotal - discount >= 5000 ? 0 : 250;
  const cart = cartSchema.parse({
    cart_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    authenticated: false,
    lines,
    item_count: lines.reduce((sum, line) => sum + line.quantity, 0),
    reservation_minutes: 30,
    quote: {
      subtotal_pkr: subtotal,
      discount_pkr: discount,
      shipping_pkr: shipping,
      total_pkr: subtotal - discount + shipping,
      discount_code: state.code,
      discount_name: state.code ? "Test discount" : null,
      discount_error: null,
      cod_eligible: true,
      estimated_days_min: 2,
      estimated_days_max: 7,
      free_shipping_threshold_pkr: 5000,
      flat_fee_pkr: 250,
    },
  });
  store.set("dwellune-test-cart", JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return { cart, wishlist: products.filter((p) => savedIds.includes(p.variant_id)) };
}
