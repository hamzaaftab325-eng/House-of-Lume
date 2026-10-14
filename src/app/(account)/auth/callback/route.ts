import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeAccountRedirect } from "@/lib/account";
import { env } from "@/lib/env";
import { signRecoveryGrant } from "@/server/account/recovery";

export async function GET(request: NextRequest) {
  const origin = env.NEXT_PUBLIC_SITE_URL;
  const params = request.nextUrl.searchParams;
  const client = await createClient();
  const code = params.get("code");
  const token = params.get("token_hash");
  const type = params.get("type");
  let recovery = false;
  let success = false;
  if (code && code.length < 4096) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    success = !error;
    recovery = params.get("flow") === "recovery";
  } else if (
    token &&
    token.length < 4096 &&
    (type === "signup" || type === "email" || type === "recovery" || type === "email_change")
  ) {
    const { error } = await client.auth.verifyOtp({ token_hash: token, type });
    success = !error;
    recovery = type === "recovery";
  }
  const next = success
    ? recovery
      ? "/auth/update-password"
      : safeAccountRedirect(params.get("next"))
    : "/auth/link-error";
  const response = NextResponse.redirect(new URL(next, origin));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  if (success && recovery) {
    const { data } = await client.auth.getClaims();
    const userId = data?.claims.sub;
    const sessionId = data?.claims.session_id;
    if (userId && typeof sessionId === "string") {
      let grant: string;
      try {
        grant = signRecoveryGrant(userId, sessionId);
      } catch {
        return NextResponse.redirect(new URL("/auth/link-error", origin));
      }
      response.cookies.set("dwellune-recovery", grant, {
        path: "/",
        httpOnly: true,
        secure: origin.startsWith("https:"),
        sameSite: "lax",
        maxAge: 600,
      });
    }
  }
  return response;
}
