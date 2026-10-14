import { NextRequest, NextResponse } from "next/server";
import { accountActionSchema } from "@/lib/account";
import { sameOrigin } from "@/lib/commerce";
import { accountIdentity, accountMutate } from "@/server/account/account.service";

export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
};
export async function GET() {
  try {
    const { customer } = await accountIdentity();
    return NextResponse.json({ customerId: customer.id }, { headers });
  } catch (error) {
    return NextResponse.json(
      { error: "Please sign in again." },
      {
        status: error instanceof Error && error.message === "authentication_required" ? 401 : 503,
        headers,
      },
    );
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
    Number(request.headers.get("content-length") ?? 0) > 16384
  )
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers });
  try {
    const body = await request.text();
    if (body.length > 16384)
      return NextResponse.json({ error: "Request is too large." }, { status: 413, headers });
    const action = accountActionSchema.safeParse(JSON.parse(body));
    if (!action.success)
      return NextResponse.json(
        { error: "Please check the form values." },
        { status: 400, headers },
      );
    return NextResponse.json(await accountMutate(action.data), { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status =
      message === "authentication_required" ? 401 : error instanceof SyntaxError ? 400 : 409;
    return NextResponse.json(
      {
        error:
          status === 401
            ? "Please sign in again."
            : message === "return_policy_unavailable"
              ? "Return requests are not open yet."
              : "We could not save this change. Please try again.",
      },
      { status, headers },
    );
  }
}
