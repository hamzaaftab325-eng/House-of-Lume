"use client";
import Link from "next/link";
import type { Route } from "next";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { unreadSchema, type NotificationAudience } from "@/lib/notifications";
import styles from "./notifications.module.css";
export function NotificationBadge({
  audience,
  enabled = true,
  compact = false,
}: {
  audience: NotificationAudience;
  enabled?: boolean;
  compact?: boolean;
}) {
  const [unread, setUnread] = useState<number | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    let alive = true;
    let generation = 0;
    const controller = new AbortController();
    async function refresh() {
      const token = ++generation;
      if (!enabled || document.visibilityState !== "visible") {
        setUnread(null);
        return;
      }
      try {
        const r = await fetch(`/api/notifications?audience=${audience}&summary=1`, {
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        const data = unreadSchema.safeParse(await r.json());
        if (alive && token === generation)
          setUnread(r.ok && data.success ? data.data.unread : null);
      } catch {
        if (alive && token === generation) setUnread(null);
      }
    }
    const changed = () => {
      setUnread(null);
      void refresh();
    };
    const storage = (e: StorageEvent) => {
      if (["dwellune-auth-change", "dwellune-notifications-change"].includes(e.key ?? ""))
        changed();
    };
    const auth =
      typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("dwellune-account") : null;
    const notifications =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("dwellune-notifications")
        : null;
    if (auth) auth.onmessage = changed;
    if (notifications) notifications.onmessage = changed;
    window.addEventListener("storage", storage);
    window.addEventListener("dwellune-notifications-changed", changed);
    document.addEventListener("visibilitychange", changed);
    const timer = setInterval(() => void refresh(), 60000);
    void refresh();
    return () => {
      alive = false;
      controller.abort();
      clearInterval(timer);
      auth?.close();
      notifications?.close();
      window.removeEventListener("storage", storage);
      window.removeEventListener("dwellune-notifications-changed", changed);
      document.removeEventListener("visibilitychange", changed);
    };
  }, [audience, enabled, pathname]);
  if (!enabled) return null;
  const label = audience === "staff" ? "Admin notifications" : "Notifications";
  return (
    <Link
      className={styles.badgeLink}
      data-compact={compact}
      href={(audience === "staff" ? "/crm/notifications" : "/account/notifications") as Route}
      aria-label={`${label}${unread === null ? "" : `, ${unread} unread`}`}
    >
      <Bell aria-hidden="true" />
      {!compact ? label : null}
      {unread !== null && unread > 0 ? (
        <span className={styles.count} aria-hidden="true">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
