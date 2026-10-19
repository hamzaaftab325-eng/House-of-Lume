import { NextResponse } from "next/server";
import { adminIdentity } from "@/server/admin/admin.service";
export const dynamic = "force-dynamic";
export async function GET() {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  try {
    const admin = await adminIdentity();
    return NextResponse.json({ userId: admin.userId }, { headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { error: "Administrator session unavailable." },
      {
        headers,
        status:
          code === "authentication_required" ? 401 : code === "admin_access_required" ? 403 : 503,
      },
    );
  }
}
