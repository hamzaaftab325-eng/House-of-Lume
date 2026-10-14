import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { checkoutDiscountSchema, checkoutError } from "@/lib/checkout";
import { sameOrigin } from "@/lib/commerce";
import { applyCheckoutDiscount } from "@/server/checkout/checkout.service";
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
    const input = checkoutDiscountSchema.parse(JSON.parse(raw));
    const token = request.cookies.get("dwellune-guest-cart")?.value;
    const hash =
      token && /^[a-f0-9]{64}$/.test(token) ? createHash("sha256").update(token).digest("hex") : "";
    return NextResponse.json(await applyCheckoutDiscount(hash, input), { headers });
  } catch (e) {
    if (e instanceof z.ZodError || e instanceof SyntaxError)
      return NextResponse.json(
        {
          error: "Enter your Pakistan delivery address before applying a discount.",
          fields:
            e instanceof z.ZodError
              ? e.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
              : [],
        },
        { status: 400, headers },
      );
    const code = e instanceof Error ? e.message : "";
    return NextResponse.json(
      { error: checkoutError(code) },
      { status: code === "authentication_required" ? 401 : 409, headers },
    );
  }
}
