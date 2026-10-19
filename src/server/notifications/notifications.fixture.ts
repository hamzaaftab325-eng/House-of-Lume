// Enabled only under the existing loopback/placeholder/no-Vercel browser-test guard.
import { cookies } from "next/headers";
import { adminFixtureEnabled, adminFixtureIdentity } from "@/server/admin/verification.fixture";
import { feedSchema, type NotificationQuery, type NotificationRead } from "@/lib/notifications";
export async function notificationFixtureIdentity(audience: "customer" | "staff") {
  if (!adminFixtureEnabled()) throw new Error("authentication_required");
  if (audience === "staff") {
    const admin = await adminFixtureIdentity();
    return { identityId: admin.userId, email: admin.email };
  }
  if ((await cookies()).get("dwellune-test-customer")?.value !== "1")
    throw new Error("authentication_required");
  return {
    identityId: "99000000-0000-4000-8000-000000000001",
    email: "customer-fixture@example.invalid",
  };
}
const stamp = "2026-10-14T00:00:00+00:00";
export async function notificationFixture(query: NotificationQuery, action?: NotificationRead) {
  const jar = await cookies();
  const key = `dwellune-test-notifications-${query.audience}`;
  let read: string[] = [];
  try {
    const raw: unknown = JSON.parse(jar.get(key)?.value ?? "[]");
    if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) read = raw;
  } catch {
    /* Initial fixture. */
  }
  const rows = Array.from({ length: 23 }, (_, i) => ({
    id: `99100000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    title: `${query.audience === "staff" ? "Operational" : "Account"} update ${i + 1}`,
    body: "A recorded fixture event for inbox testing.",
    priority: i === 0 ? ("critical" as const) : ("normal" as const),
    read_at: read.includes(String(i + 1)) ? stamp : null,
    created_at: stamp,
    category: i === 0 ? ("verification" as const) : ("orders" as const),
    href: null,
  })).reverse();
  if (action) {
    if (action.action === "read") {
      const n = rows.find((x) => x.id === action.id);
      if (!n) throw new Error("notification_unavailable");
      read.push(String(Number(n.id.slice(-12))));
    } else read = rows.map((n) => String(Number(n.id.slice(-12))));
    jar.set(key, JSON.stringify(read), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });
    return { unread: 23 - new Set(read).size };
  }
  const eligible = rows.filter(
    (x) =>
      (query.read !== "unread" || !x.read_at) &&
      (query.category === "all" || x.category === query.category) &&
      (query.priority === "all" || x.priority === query.priority),
  );
  const anchor = query.before ? rows.findIndex((x) => x.id === query.before) : -1;
  if (query.before && anchor < 0) throw new Error("notification_cursor_unavailable");
  const remaining = eligible.filter((x) => anchor < 0 || rows.indexOf(x) > anchor);
  return feedSchema.parse({
    items: remaining.slice(0, 20),
    next_cursor: remaining.length > 20 ? remaining[19].id : null,
    unread: 23 - new Set(read).size,
    cutoff: stamp,
  });
}
