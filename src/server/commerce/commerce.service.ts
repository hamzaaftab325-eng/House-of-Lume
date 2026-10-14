import { createClient } from "@/lib/supabase/server";
import { commerceResponseSchema, type CommerceAction, type CommerceResponse } from "@/lib/commerce";

export async function commerceService(
  guestHash: string,
  savedIds: string[],
  action?: CommerceAction,
): Promise<CommerceResponse> {
  if (
    process.env.COMMERCE_TEST_FIXTURES === "1" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === "https://example.supabase.co" &&
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(process.env.NEXT_PUBLIC_SITE_URL ?? "")
  ) {
    const { commerceFixture } = await import("./commerce.fixture");
    return commerceFixture(savedIds, action);
  }
  const client = await createClient();
  // getUser verifies the session with Auth; the RPC derives ownership from auth.uid().
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError && authError.name !== "AuthSessionMissingError")
    throw new Error("authentication_required");
  if (user) {
    const session = await client.rpc("account_session_valid");
    if (session.error || session.data !== true) throw new Error("authentication_required");
  }
  const rpc = async (name: string, args: Record<string, unknown> = {}) => {
    const { data, error } = await client.rpc(name, args);
    if (error) throw new Error(error.message);
    return data as unknown;
  };
  let cart: unknown;
  switch (action?.action) {
    case "add":
      cart = await rpc("commerce_cart_add", {
        p_guest_token_hash: guestHash,
        p_variant_id: action.variantId,
        p_quantity: action.quantity,
      });
      break;
    case "quantity":
      cart = await rpc("commerce_cart_set_quantity", {
        p_guest_token_hash: guestHash,
        p_variant_id: action.variantId,
        p_quantity: action.quantity,
      });
      break;
    case "discount":
      cart = await rpc("commerce_cart_apply_discount", {
        p_guest_token_hash: guestHash,
        p_code: action.code,
      });
      break;
    case "import":
      cart = await rpc("commerce_cart_import", {
        p_guest_token_hash: guestHash,
        p_import_id: action.importId,
        p_lines: action.lines,
      });
      break;
    case "save":
      if (user)
        await rpc("commerce_wishlist_set", {
          p_variant_id: action.variantId,
          p_saved: action.saved,
        });
      break;
    case "move":
      cart = await rpc("commerce_wishlist_move_to_cart", {
        p_guest_token_hash: guestHash,
        p_variant_id: action.variantId,
      });
      break;
    case "sync":
      if (user && action.savedIds.length)
        await rpc("commerce_wishlist_merge", { p_variant_ids: action.savedIds });
      break;
  }
  cart ??= await rpc("commerce_cart_snapshot", { p_guest_token_hash: guestHash });
  const wishlist = user
    ? await rpc("commerce_wishlist_snapshot")
    : await rpc("commerce_wishlist_preview", { p_variant_ids: savedIds });
  return commerceResponseSchema.parse({
    cart,
    wishlist:
      typeof wishlist === "object" && wishlist !== null && "lines" in wishlist
        ? wishlist.lines
        : [],
  });
}
