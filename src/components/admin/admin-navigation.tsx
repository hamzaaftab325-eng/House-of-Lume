"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import styles from "./verification.module.css";

const destinations: Array<{ href: Route; label: string; section: string }> = [
  { href: "/crm", label: "Overview", section: "overview" },
  { href: "/crm/verification", label: "COD verification", section: "verification" },
  { href: "/crm/verification/settings", label: "Verification rules", section: "rules" },
  { href: "/crm/notifications", label: "Notifications", section: "notifications" },
  { href: "/crm/notifications/delivery", label: "Delivery status", section: "delivery" },
];

function activeSection(pathname: string) {
  if (pathname.startsWith("/crm/verification/settings")) return "rules";
  if (pathname.startsWith("/crm/verification")) return "verification";
  if (pathname.startsWith("/crm/notifications/delivery")) return "delivery";
  if (pathname.startsWith("/crm/notifications")) return "notifications";
  return "overview";
}

export function AdminNavigation() {
  const pathname = usePathname();
  const current = activeSection(pathname);

  return (
    <nav className={styles.adminNav} aria-label="Administrator navigation">
      <Link className={styles.brandLink} href="/crm" aria-label="DWELLUNE admin overview">
        DWELLUNE <span>ADMIN</span>
      </Link>
      <div className={styles.navLinks}>
        {destinations.map(({ href, label, section }) => (
          <Link
            key={href}
            href={href}
            className={current === section ? styles.activeNavLink : styles.navLink}
            aria-current={current === section ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
        <NotificationBadge audience="staff" />
      </div>
    </nav>
  );
}
