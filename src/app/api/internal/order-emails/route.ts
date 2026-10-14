import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runOrderEmails } from "@/server/email/order-email.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const inputSchema = z.object({ action: z.enum(["dispatch", "verify", "test"]) }).strict();

export async function POST(request: NextRequest) {
  const secret = process.env.ORDER_EMAIL_WORKER_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const providedBytes = Buffer.from(provided);
  const secretBytes = Buffer.from(secret ?? "");
  if (
    !secret ||
    secret.length < 32 ||
    providedBytes.length !== secretBytes.length ||
    !timingSafeEqual(providedBytes, secretBytes)
  )
    return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers });
  try {
    const raw = await request.text();
    if (raw.length > 256)
      return NextResponse.json({ error: "Invalid request." }, { status: 413, headers });
    const { action } = inputSchema.parse(JSON.parse(raw));
    return NextResponse.json(await runOrderEmails(secret, action), { headers });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid request." }, { status: 400, headers });
    // Never include raw SMTP errors, addresses, credentials or RPC parameters in logs/responses.
    console.error(JSON.stringify({ event: "order_email_worker_failed" }));
    return NextResponse.json(
      { error: "Email worker requires attention." },
      { status: 503, headers },
    );
  }
}
