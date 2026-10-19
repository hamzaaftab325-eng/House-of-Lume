import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/commerce";
import { verificationActionSchema, verificationError } from "@/lib/verification";
import { verificationAction } from "@/server/admin/verification.service";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
const conflicts = [
  "verification_changed",
  "verification_idempotency_conflict",
  "verification_transition_invalid",
  "cancellation_unavailable",
  "verification_attempt_limit",
  "invalid_verification_input",
  "manual_review_required",
];
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
    Number(request.headers.get("content-length") ?? 0) > 12_000
  )
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers });
  try {
    const raw = await request.text();
    if (raw.length > 12_000)
      return NextResponse.json({ error: "Request is too large." }, { status: 413, headers });
    return NextResponse.json(
      await verificationAction(verificationActionSchema.parse(JSON.parse(raw))),
      { headers },
    );
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return NextResponse.json(
        { error: "Choose an action and add a note of 3–2000 characters." },
        { status: 400, headers },
      );
    const code = error instanceof Error ? error.message : "";
    const status =
      code === "authentication_required"
        ? 401
        : ["staff_access_required", "admin_access_required"].includes(code)
          ? 403
          : code === "order_unavailable"
            ? 404
            : conflicts.includes(code)
              ? 409
              : 503;
    return NextResponse.json({ error: verificationError(code) }, { status, headers });
  }
}
