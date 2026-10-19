import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/commerce";
import { notificationQuerySchema, readSchema } from "@/lib/notifications";
import {
  notificationFeed,
  notificationUnread,
  notificationRead,
} from "@/server/notifications/notifications.service";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "Referrer-Policy": "no-referrer",
};
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const status =
    code === "authentication_required"
      ? 401
      : ["staff_access_required", "admin_access_required"].includes(code)
        ? 403
        : code === "notification_unavailable"
          ? 404
          : code === "notification_cursor_unavailable"
            ? 409
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
            : status === 409
              ? "This page is unavailable. Return to newest notifications."
              : status === 400
                ? "Check the notification request."
                : "Notifications are unavailable. Please retry.",
    },
    { status, headers },
  );
}
export async function GET(request: NextRequest) {
  try {
    const query = notificationQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    return NextResponse.json(
      query.summary ? await notificationUnread(query.audience) : await notificationFeed(query),
      { headers },
    );
  } catch (e) {
    return failure(e);
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
    Number(request.headers.get("content-length") ?? 0) > 2048
  )
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers });
  try {
    const raw = await request.text();
    if (raw.length > 2048)
      return NextResponse.json({ error: "Request too large." }, { status: 413, headers });
    return NextResponse.json(await notificationRead(readSchema.parse(JSON.parse(raw))), {
      headers,
    });
  } catch (e) {
    return failure(e);
  }
}
