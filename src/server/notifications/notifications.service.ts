import { createClient } from "@/lib/supabase/server";
import { accountIdentity } from "@/server/account/account.service";
import { adminIdentity } from "@/server/admin/admin.service";
import { adminFixtureEnabled } from "@/server/admin/verification.fixture";
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
  if (adminFixtureEnabled()) return notificationFixtureIdentity(audience);
  if (audience === "staff") {
    const admin = await adminIdentity();
    return { identityId: admin.userId, email: admin.email };
  }
  const { customer, email } = await accountIdentity();
  return { identityId: customer.id, email };
}
export async function notificationFeed(query: NotificationQuery) {
  await notificationIdentity(query.audience);
  if (adminFixtureEnabled()) return feedSchema.parse(await notificationFixture(query));
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
  if (adminFixtureEnabled()) {
    const result = parseUnread(
      await notificationFixture({ audience, read: "all", category: "all", priority: "all" }),
    );
    return {
      ...result,
      ...(audience === "staff"
        ? { userId: identity.identityId }
        : { customerId: identity.identityId }),
    };
  }
  const client = await createClient();
  const { data, error } = await client.rpc("notification_unread", { p_audience: audience });
  if (error) throw new Error(error.message);
  return {
    ...parseUnread({ unread: data }),
    ...(audience === "staff"
      ? { userId: identity.identityId }
      : { customerId: identity.identityId }),
  };
}
export async function notificationRead(action: NotificationRead) {
  await notificationIdentity(action.audience);
  if (adminFixtureEnabled())
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
