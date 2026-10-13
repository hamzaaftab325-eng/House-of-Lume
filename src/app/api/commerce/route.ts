import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { commerceActionSchema, commerceError, sameOrigin } from "@/lib/commerce";
import { commerceService } from "@/server/commerce/commerce.service";

export const dynamic = "force-dynamic";
const COOKIE = "dwellune-guest-cart";
const savedIdsSchema = z.array(z.uuid()).max(50);
const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
};

async function handle(request: NextRequest) {
  try {
    const write = request.method === "POST";
    const origin = request.headers.get("origin");
    if (
      write &&
      (!sameOrigin(
        origin,
        request.headers.get("host") ?? request.nextUrl.host,
        request.nextUrl.protocol,
      ) ||
        request.headers.get("sec-fetch-site") === "cross-site")
    )
      return NextResponse.json(
        { error: "Request origin is not allowed." },
        { status: 403, headers },
      );
    if (
      write &&
      (!request.headers.get("content-type")?.startsWith("application/json") ||
        Number(request.headers.get("content-length") ?? 0) > 16384)
    )
      return NextResponse.json({ error: "Invalid request." }, { status: 400, headers });
    let action;
    if (write) {
      const body = await request.text();
      if (body.length > 16384)
        return NextResponse.json({ error: "Request is too large." }, { status: 413, headers });
      action = commerceActionSchema.parse(JSON.parse(body));
    }
    const savedIds = savedIdsSchema.parse(request.nextUrl.searchParams.getAll("saved"));
    const previous = request.cookies.get(COOKIE)?.value;
    const token =
      previous && /^[a-f0-9]{64}$/.test(previous) ? previous : randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");
    const data = await commerceService(hash, savedIds, action);
    const response = NextResponse.json(data, { headers });
    response.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return NextResponse.json(
        { error: "Please check the values and try again." },
        { status: 400, headers },
      );
    return NextResponse.json(
      { error: commerceError(error instanceof Error ? error.message : "") },
      { status: 409, headers },
    );
  }
}
export const GET = handle;
export const POST = handle;
