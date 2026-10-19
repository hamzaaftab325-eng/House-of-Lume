import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { notificationQuerySchema, type NotificationAudience } from "@/lib/notifications";
import {
  notificationFeed,
  notificationIdentity,
} from "@/server/notifications/notifications.service";
import { AccountSessionGuard } from "@/components/account/session-guard";
import { NotificationCenter } from "./notification-center";
import styles from "@/components/account/account.module.css";
export async function NotificationPage({
  audience,
  searchParams,
}: {
  audience: NotificationAudience;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  // Ignore legacy offset parameters, but validate every supported filter.
  const parsed = notificationQuerySchema.safeParse({
    audience,
    read: params.read ?? (params.filter === "unread" ? "unread" : "all"),
    category:
      params.category ??
      (["orders", "returns", "account"].includes(params.filter ?? "") ? params.filter : "all"),
    priority: params.priority ?? "all",
    before: params.before,
  });
  if (!parsed.success)
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Notification filters unavailable.</h1>
        <Link
          href={(audience === "staff" ? "/crm/notifications" : "/account/notifications") as Route}
        >
          Reset notification filters
        </Link>
      </main>
    );
  let feed, identity;
  try {
    identity = await notificationIdentity(audience);
    feed = await notificationFeed(parsed.data);
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "authentication_required")
      redirect(
        `/auth/signin?next=${encodeURIComponent(audience === "staff" ? "/crm/notifications" : "/account/notifications")}`,
      );
    if (code === "notification_cursor_unavailable")
      return (
        <main className={styles.page}>
          <h1 className={styles.title}>This notification page is unavailable.</h1>
          <Link
            href={(audience === "staff" ? "/crm/notifications" : "/account/notifications") as Route}
          >
            Newest notifications
          </Link>
        </main>
      );
    throw e;
  }
  const content = (
    <>
      <p className={styles.eyebrow}>
        DWELLUNE · {audience === "staff" ? "Operations" : "Your account"}
      </p>
      <h1 className={styles.title}>
        {audience === "staff" ? "Admin notifications." : "Your notifications."}
      </h1>
      <p className={styles.intro}>
        {audience === "staff"
          ? "Operational updates for the store owner. Customer notifications remain separate."
          : "Updates addressed to your account. Reading a notice does not change your order."}
      </p>
      {audience === "customer" ? (
        <nav className={styles.nav} aria-label="Account navigation">
          <Link href="/account">Profile</Link>
          <Link href="/account/orders">Your orders</Link>
          <Link href="/account/notifications" aria-current="page">
            Notifications
          </Link>
          <Link href="/account/settings">Account settings</Link>
        </nav>
      ) : null}
      <div className={styles.actions}>
        <Link
          href={
            (audience === "staff"
              ? "/crm/notifications/delivery"
              : "/account/notifications/preferences") as Route
          }
        >
          {audience === "staff" ? "Delivery status and event registry" : "Notification settings"}
        </Link>
      </div>
      <NotificationCenter
        key={`${parsed.data.read}/${parsed.data.category}/${parsed.data.priority}`}
        feed={feed}
        query={parsed.data}
      />
    </>
  );
  return (
    <main className={styles.page}>
      {audience === "customer" ? (
        <AccountSessionGuard
          customerId={identity.identityId}
          sessionEndpoint="/api/notifications?audience=customer&summary=1"
        >
          {content}
        </AccountSessionGuard>
      ) : (
        content
      )}
    </main>
  );
}
