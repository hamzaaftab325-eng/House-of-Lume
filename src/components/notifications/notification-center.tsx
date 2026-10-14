"use client";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  categories,
  priorities,
  unreadSchema,
  type NotificationFeed,
  type NotificationQuery,
  type NotificationRead,
} from "@/lib/notifications";
import { DwelluneButton } from "@/components/ui/controls";
import { broadcastNotificationRead } from "./notification-events";
import styles from "@/components/account/account.module.css";
import inboxStyles from "./notifications.module.css";
export function NotificationCenter({
  feed,
  query,
}: {
  feed: NotificationFeed;
  query: NotificationQuery;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState<NotificationRead | null>(null);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const storage = (e: StorageEvent) => {
      if (e.key === "dwellune-notifications-change") refresh();
    };
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("dwellune-notifications")
        : null;
    if (channel) channel.onmessage = refresh;
    window.addEventListener("dwellune-notifications-changed", refresh);
    window.addEventListener("storage", storage);
    document.addEventListener("visibilitychange", refresh);
    const timer = setInterval(refresh, 60000);
    return () => {
      channel?.close();
      clearInterval(timer);
      window.removeEventListener("dwellune-notifications-changed", refresh);
      window.removeEventListener("storage", storage);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);
  const base = query.audience === "staff" ? "/crm/notifications" : "/account/notifications";
  function href(overrides: Partial<NotificationQuery>) {
    const next = { ...query, ...overrides };
    const params = new URLSearchParams({
      read: next.read,
      category: next.category,
      priority: next.priority,
    });
    if (next.before) params.set("before", next.before);
    return `${base}?${params}` as Route;
  }
  async function mark(action: NotificationRead) {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setMessage("");
    try {
      const r = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
        signal: AbortSignal.timeout(15000),
      });
      const body: unknown = await r.json();
      if (!r.ok || !unreadSchema.safeParse(body).success) {
        if (r.status >= 500 || r.ok) {
          setAttempt(action);
          setMessage("We could not confirm the read update. Retry the same update.");
        } else {
          setAttempt(null);
          setMessage(
            r.status === 401
              ? "Your session ended. Sign in again."
              : "This update is unavailable. Refresh notifications before continuing.",
          );
        }
        return;
      }
      setAttempt(null);
      setMessage("Read status updated.");
      broadcastNotificationRead();
      router.refresh();
    } catch {
      setAttempt(action);
      setMessage("We could not confirm the read update. Retry the same update.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <>
      <form action={base} className={styles.form}>
        <div>
          <label htmlFor="notification-read">Show</label>
          <select
            id="notification-read"
            name="read"
            defaultValue={query.read}
            className={inboxStyles.select}
          >
            <option value="all">All notifications</option>
            <option value="unread">Unread only</option>
          </select>
        </div>
        <div>
          <label htmlFor="notification-category">Category</label>
          <select
            id="notification-category"
            name="category"
            defaultValue={query.category}
            className={inboxStyles.select}
          >
            {categories.map((x) => (
              <option key={x} value={x}>
                {x === "all" ? "All categories" : x[0].toUpperCase() + x.slice(1)}
              </option>
            ))}
          </select>
        </div>
        {query.audience === "staff" ? (
          <div>
            <label htmlFor="notification-priority">Priority</label>
            <select
              id="notification-priority"
              name="priority"
              defaultValue={query.priority}
              className={inboxStyles.select}
            >
              {priorities.map((x) => (
                <option key={x} value={x}>
                  {x === "all" ? "All priorities" : x[0].toUpperCase() + x.slice(1)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <DwelluneButton type="submit" variant="frame">
          Apply filters
        </DwelluneButton>
      </form>
      <p role="status">
        {feed.unread} unread in your {query.audience === "staff" ? "staff" : "customer"} inbox
      </p>
      <div className={styles.actions}>
        {feed.unread > 0 ? (
          <DwelluneButton
            disabled={pending || Boolean(attempt)}
            onClick={() =>
              void mark({ action: "readAll", audience: query.audience, cutoff: feed.cutoff })
            }
          >
            Mark all as read
          </DwelluneButton>
        ) : null}
        <DwelluneButton variant="quiet" disabled={pending} onClick={() => router.refresh()}>
          Refresh notifications
        </DwelluneButton>
      </div>
      {feed.unread > 0 ? (
        <p className={styles.intro}>
          Mark all applies to your whole inbox up to this page’s load time, including other filters
          and pages. Newer notices stay unread.
        </p>
      ) : null}
      {message ? (
        <p role="status" aria-live="polite" className={styles.message}>
          {message}
        </p>
      ) : null}
      {attempt ? (
        <DwelluneButton disabled={pending} onClick={() => void mark(attempt)}>
          Retry read update
        </DwelluneButton>
      ) : null}
      {feed.items.length ? (
        <ol className={inboxStyles.list}>
          {feed.items.map((n) => (
            <li key={n.id}>
              <article className={styles.row} data-priority={n.priority}>
                <div>
                  <h2>{n.title}</h2>
                  <p>{n.body}</p>
                  <p>
                    {n.category} · <strong>{n.priority} priority</strong> ·{" "}
                    {n.read_at ? "Read" : "Unread"}
                  </p>
                  <p>
                    <time dateTime={n.created_at}>
                      {new Date(n.created_at).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
                    </time>
                  </p>
                  {n.href ? (
                    <Link href={n.href as Route}>
                      Open related{" "}
                      {n.category === "products"
                        ? "product"
                        : n.category === "account"
                          ? "account"
                          : "order"}
                    </Link>
                  ) : null}
                </div>
                {!n.read_at ? (
                  <DwelluneButton
                    variant="frame"
                    disabled={pending || Boolean(attempt)}
                    aria-label={`Mark ${n.title} as read`}
                    onClick={() =>
                      void mark({ action: "read", audience: query.audience, id: n.id })
                    }
                  >
                    Mark as read
                  </DwelluneButton>
                ) : null}
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.empty}>
          No notifications in this view. Recorded updates will appear here.
        </p>
      )}
      <nav className={styles.actions} aria-label="Notification pages">
        {query.before ? <Link href={href({ before: undefined })}>Newest notifications</Link> : null}
        {feed.next_cursor ? (
          <Link href={href({ before: feed.next_cursor })}>Older notifications</Link>
        ) : null}
      </nav>
    </>
  );
}
