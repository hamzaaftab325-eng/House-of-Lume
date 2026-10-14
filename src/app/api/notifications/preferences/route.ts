import { NextRequest, NextResponse } from "next/server";
import { preferenceValuesSchema } from "@/lib/notification-controls";
import { notificationPreferences } from "@/server/notifications/controls.service";
import {
  notificationHeaders as headers,
  notificationFailure,
  notificationOrigin,
} from "@/server/notifications/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await notificationPreferences(), { headers });
  } catch (e) {
    return notificationFailure(e);
  }
}
export async function POST(request: NextRequest) {
  if (!notificationOrigin(request))
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
    return NextResponse.json(
      await notificationPreferences(preferenceValuesSchema.parse(JSON.parse(raw))),
      { headers },
    );
  } catch (e) {
    return notificationFailure(e);
  }
}
