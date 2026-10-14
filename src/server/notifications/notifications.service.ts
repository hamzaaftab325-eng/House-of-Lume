import { createClient } from "@/lib/supabase/server";
import { accountIdentity } from "@/server/account/account.service";
import { adminIdentity } from "@/server/admin/admin.service";
import { staffFixtureEnabled } from "@/server/admin/verification.fixture";
import { notificationFixture, notificationFixtureIdentity } from "./notifications.fixture";
import {
  feedSchema,
  unreadSchema,
  safeNotificationLink,
  type NotificationQuery,
  type NotificationRead,
  type NotificationAudience,
} from "@/lib/notifications";
function parseUnread(data: unknown) {
  const parsed = unreadSchema.safeParse(data);
  if (!parsed.success) throw new Error("notification_result_unavailable");
  return parsed.data;
}
export async function notificationIdentity(audience: NotificationAudience) {
  if (staffFixtureEnabled()) return notificationFixtureIdentity(audience);
  if (audience === "staff") return adminIdentity();
  const { customer, email } = await accountIdentity();
  return { customerId: customer.id, email };
}
export async function notificationFeed(query: NotificationQuery) {
  await notificationIdentity(query.audience);
  if (staffFixtureEnabled()) return feedSchema.parse(await notificationFixture(query));
  const client = await createClient();
  const { data, error } = await client.rpc("notification_feed", {
    p_audience: query.audience,
    p_read: query.read,
    p_category: query.category,
    p_priority: query.priority,
    p_before: query.before,
  });
  if (error) throw new Error(error.message);
  const parsed = feedSchema.safeParse(data);
  if (!parsed.success) throw new Error("notification_result_unavailable");
  const feed = parsed.data;
  return {
    ...feed,
    items: feed.items.map((n) => ({ ...n, href: safeNotificationLink(n.href, query.audience) })),
  };
}
export async function notificationUnread(audience: NotificationAudience) {
  const identity = await notificationIdentity(audience);
  if (staffFixtureEnabled()) {
    const result = parseUnread(
      await notificationFixture({ audience, read: "all", category: "all", priority: "all" }),
    );
    return { ...result, customerId: identity.customerId };
  }
  const client = await createClient();
  const { data, error } = await client.rpc("notification_unread", { p_audience: audience });
  if (error) throw new Error(error.message);
  return { ...parseUnread({ unread: data }), customerId: identity.customerId };
}
export async function notificationRead(action: NotificationRead) {
  await notificationIdentity(action.audience);
  if (staffFixtureEnabled())
    return parseUnread(
      await notificationFixture(
        { audience: action.audience, read: "all", category: "all", priority: "all" },
        action,
      ),
    );
  const client = await createClient();
  const { data, error } = await client.rpc("notification_read", {
    p_audience: action.audience,
    ...(action.action === "read" ? { p_id: action.id } : { p_cutoff: action.cutoff }),
  });
  if (error) throw new Error(error.message);
  return parseUnread(data);
}
