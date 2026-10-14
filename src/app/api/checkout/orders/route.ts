import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { placeOrderSchema, checkoutError } from "@/lib/checkout";
import { sameOrigin } from "@/lib/commerce";
import { placeOrder, recoverOrderAttempt } from "@/server/checkout/checkout.service";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export async function POST(request: NextRequest) {
  if (
    !sameOrigin(
      request.headers.get("origin"),
      request.headers.get("host") ?? request.nextUrl.host,
      request.nextUrl.protocol,
    ) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403, headers });
  if (
    !request.headers.get("content-type")?.startsWith("application/json") ||
    Number(request.headers.get("content-length") ?? 0) > 8192
  )
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers });
  try {
    const raw = await request.text();
    if (raw.length > 8192)
      return NextResponse.json({ error: "Request is too large." }, { status: 413, headers });
    const payload = placeOrderSchema.parse(JSON.parse(raw));
    const token = request.cookies.get("dwellune-guest-cart")?.value;
    const hash =
      token && /^[a-f0-9]{64}$/.test(token) ? createHash("sha256").update(token).digest("hex") : "";
    return NextResponse.json(await placeOrder(hash, payload), { headers });
  } catch (e) {
    if (e instanceof z.ZodError || e instanceof SyntaxError)
      return NextResponse.json(
        { error: "Check your checkout details and review the current total." },
        { status: 400, headers },
      );
    const code = e instanceof Error ? e.message : "";
    return NextResponse.json(
      {
        error: checkoutError(code),
        code: [
          "quote_changed",
          "idempotency_conflict",
          "checkout_not_open",
          "test_product_not_orderable",
        ].includes(code)
          ? code
          : "order_failed",
      },
      {
        status:
          code === "authentication_required"
            ? 401
            : code === "checkout_order_limit"
              ? 429
              : [
                    "quote_changed",
                    "idempotency_conflict",
                    "checkout_not_open",
                    "test_product_not_orderable",
                    "empty_cart",
                    "guest_cart_token_required",
                    "invalid_checkout",
                    "invalid_delivery_address",
                    "delivery_area_unsupported",
                    "cod_not_eligible",
                    "checkout_item_limit",
                    "insufficient_stock",
                    "variant_unavailable",
                    "discount_not_eligible",
                    "saved_address_unavailable",
                    "guest_checkout_disabled",
                  ].includes(code)
                ? 409
                : 503,
        headers,
      },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const key = z.uuid().parse(request.nextUrl.searchParams.get("attempt"));
    const token = request.cookies.get("dwellune-guest-cart")?.value;
    const hash =
      token && /^[a-f0-9]{64}$/.test(token) ? createHash("sha256").update(token).digest("hex") : "";
    return NextResponse.json({ order: await recoverOrderAttempt(hash, key) }, { headers });
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    return NextResponse.json(
      { error: checkoutError(code) },
      {
        status: e instanceof z.ZodError ? 400 : code === "authentication_required" ? 401 : 503,
        headers,
      },
    );
  }
}
