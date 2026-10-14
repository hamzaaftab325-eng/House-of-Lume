import { NextRequest, NextResponse } from "next/server";
import { deliveryFilterSchema } from "@/lib/notification-controls";
import { notificationOperations } from "@/server/notifications/controls.service";
import { notificationHeaders as headers, notificationFailure } from "@/server/notifications/http";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      await notificationOperations(
        deliveryFilterSchema.parse(request.nextUrl.searchParams.get("status") ?? "all"),
      ),
      { headers },
    );
  } catch (e) {
    return notificationFailure(e);
  }
}
