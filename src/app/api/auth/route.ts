import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { sameOrigin } from "@/lib/commerce";
import { verifyRecoveryGrant } from "@/server/account/recovery";
import { passwordSignUp } from "@/server/account/password-signup";

export const dynamic = "force-dynamic";
const password = z.string().min(12).max(128);
const credentials = { email: z.email().max(254), password: z.string().min(1).max(128) };
const schema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("signup"),
      ...credentials,
      password,
      name: z.string().trim().min(2).max(100),
    })
    .strict(),
  z.object({ action: z.literal("signin"), ...credentials }).strict(),
  z.object({ action: z.literal("signout") }).strict(),
  z.object({ action: z.literal("reset"), email: z.email().max(254) }).strict(),
  z.object({ action: z.literal("resend"), email: z.email().max(254) }).strict(),
  z
    .object({
      action: z.literal("recover"),
      password,
      confirm: password,
      nonce: z.string().max(12).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("password"),
      currentPassword: z.string().min(1).max(128),
      password,
      confirm: password,
      nonce: z.string().max(12).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("email"),
      currentPassword: z.string().min(1).max(128),
      email: z.email().max(254),
    })
    .strict(),
  z.object({ action: z.literal("reauthenticate") }).strict(),
]);
const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "Referrer-Policy": "no-referrer",
};
export async function POST(request: NextRequest) {
  const response = (error: string, status: number) =>
    NextResponse.json({ error }, { status, headers });
  if (
    !sameOrigin(
      request.headers.get("origin"),
      request.headers.get("host") ?? request.nextUrl.host,
      request.nextUrl.protocol,
    ) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return response("Request origin is not allowed.", 403);
  if (
    !request.headers.get("content-type")?.startsWith("application/json") ||
    Number(request.headers.get("content-length") ?? 0) > 8192
  )
    return response("Invalid request.", 400);
  try {
    const body = await request.text();
    if (body.length > 8192) return response("Request is too large.", 413);
    const parsed = schema.safeParse(JSON.parse(body));
    if (!parsed.success)
      return response(
        "Please check the form values. New passwords must contain at least 12 characters.",
        400,
      );
    const values = parsed.data;
    const emailReady = process.env.AUTH_EMAIL_READY === "true";
    if (["reset", "email", "reauthenticate"].includes(values.action) && !emailReady)
      return response("Account email delivery is being prepared. Please try again later.", 503);
    if (
      (values.action === "recover" || values.action === "password") &&
      values.password !== values.confirm
    )
      return response("The new passwords do not match.", 400);
    const client = await createClient();
    const callback = `${env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
    let result;
    if (values.action === "signup") {
      result = await passwordSignUp(values.email, values.password, values.name);
      if (!result.error) {
        if (!result.data.session)
          return response(
            "Your account session could not be started. Please sign in or try again.",
            409,
          );
        const installed = await client.auth.setSession({
          access_token: result.data.session.access_token,
          refresh_token: result.data.session.refresh_token,
        });
        if (installed.error)
          return response("Your account was created. Please sign in to continue.", 502);
      }
    } else if (values.action === "signin")
      result = await client.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
    else if (values.action === "signout") result = await client.auth.signOut({ scope: "global" });
    else if (values.action === "reset")
      result = await client.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${callback}?flow=recovery`,
      });
    else if (values.action === "resend")
      return response(
        "Signup no longer needs a verification email. Please sign in to continue.",
        409,
      );
    else {
      const {
        data: { user },
        error,
      } = await client.auth.getUser();
      if (error || !user?.email) return response("Please sign in again.", 401);
      const session = await client.rpc("account_session_valid");
      if (session.error || session.data !== true) return response("Please sign in again.", 401);
      if (values.action === "reauthenticate") result = await client.auth.reauthenticate();
      else {
        if (values.action === "recover") {
          const { data } = await client.auth.getClaims();
          const sessionId = data?.claims.session_id;
          if (
            typeof sessionId !== "string" ||
            !verifyRecoveryGrant(
              request.cookies.get("dwellune-recovery")?.value,
              user.id,
              sessionId,
            )
          )
            return response(
              "Open a new password recovery link before updating your password.",
              401,
            );
        } else {
          const verified = await client.auth.signInWithPassword({
            email: user.email,
            password: values.currentPassword,
          });
          if (verified.error) return response("Your current password could not be verified.", 401);
        }
        if (values.action === "email")
          result = await client.auth.updateUser(
            { email: values.email },
            { emailRedirectTo: callback },
          );
        else {
          result = await client.auth.updateUser({
            password: values.password,
            ...(values.nonce ? { nonce: values.nonce } : {}),
          });
          if (!result.error) {
            const revoked = await client.auth.signOut({
              scope: values.action === "recover" ? "global" : "others",
            });
            if (revoked.error)
              return response(
                "Your password changed, but other sessions could not be closed. Please sign out of all sessions.",
                502,
              );
          }
        }
      }
    }
    if (result.error) {
      if (result.error.status === 429)
        return response("Too many attempts. Please wait before trying again.", 429);
      return response(
        values.action === "signin"
          ? "We could not sign you in. Check your email address and password."
          : values.action === "signup"
            ? "We could not create your account. Check your details, or sign in if you already have an account."
            : "We could not complete this request. Check your details, request a fresh link or verification code, and try again.",
        400,
      );
    }
    const final = NextResponse.json(
      {
        saved: true,
        authenticated: values.action === "signup" || values.action === "signin",
        message:
          values.action === "signup"
            ? "Your account is ready. Taking you to your account…"
            : ["reset", "resend"].includes(values.action)
              ? "If the address is eligible, an email with the next steps will arrive shortly."
              : values.action === "email"
                ? "Confirm the email change using the verification messages."
                : values.action === "reauthenticate"
                  ? "Check your email for a verification code."
                  : "Your change has been saved.",
      },
      { headers },
    );
    if (values.action === "recover" || values.action === "signout")
      final.cookies.delete("dwellune-recovery");
    return final;
  } catch (error) {
    if (error instanceof Error && error.message === "signup_confirmation_enabled")
      return response("Instant signup is being enabled. Please try again shortly.", 503);
    if (error instanceof Error && error.message === "signup_configuration_unavailable")
      return response("Account signup is temporarily unavailable. Please try again shortly.", 503);
    return response("We could not complete this request. Please try again.", 400);
  }
}
