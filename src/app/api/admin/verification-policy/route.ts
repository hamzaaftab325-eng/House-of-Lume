import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/commerce";
import { policyActionSchema, verificationError } from "@/lib/verification";
import { verificationPolicy } from "@/server/admin/verification-policy.service";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "Referrer-Policy": "no-referrer",
};
function failure(error: unknown) {
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return NextResponse.json(
      { error: "Check the rule values and add a reason for changing them." },
      { status: 400, headers },
    );
  const code = error instanceof Error ? error.message : "";
  const status =
    code === "authentication_required"
      ? 401
      : code === "staff_access_required"
        ? 403
        : [
              "verification_changed",
              "verification_idempotency_conflict",
              "invalid_verification_policy",
            ].includes(code)
          ? 409
          : 503;
  return NextResponse.json({ error: verificationError(code) }, { status, headers });
}
export async function GET() {
  try {
    return NextResponse.json(await verificationPolicy(), { headers });
  } catch (error) {
    return failure(error);
  }
}
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
      return NextResponse.json({ error: "Invalid request." }, { status: 413, headers });
    return NextResponse.json(await verificationPolicy(policyActionSchema.parse(JSON.parse(raw))), {
      headers,
    });
  } catch (error) {
    return failure(error);
  }
}
