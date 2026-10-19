import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/commerce";
export const notificationHeaders = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "Referrer-Policy": "no-referrer",
};
export function notificationFailure(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const status =
    code === "authentication_required"
      ? 401
      : ["staff_access_required", "admin_access_required"].includes(code)
        ? 403
        : error instanceof z.ZodError ||
            error instanceof SyntaxError ||
            code === "invalid_notification_input"
          ? 400
          : 503;
  return NextResponse.json(
    {
      error:
        status === 401
          ? "Please sign in again."
          : status === 403
            ? "Administrator access required."
            : status === 400
              ? "Check the notification settings."
              : "The result is unavailable. Please retry.",
    },
    { status, headers: notificationHeaders },
  );
}
export function notificationOrigin(request: NextRequest) {
  return (
    sameOrigin(
      request.headers.get("origin"),
      request.headers.get("host") ?? request.nextUrl.host,
      request.nextUrl.protocol,
    ) && request.headers.get("sec-fetch-site") !== "cross-site"
  );
}
