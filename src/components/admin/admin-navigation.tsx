"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  ArrowUpRight,
  Bell,
  ClipboardCheck,
  House,
  MailCheck,
  Menu,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { SignOutButton } from "@/components/account/account-forms";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import styles from "./workspace.module.css";

const destinations = [
  { href: "/crm", label: "Overview", icon: House, group: "Workspace" },
  {
    href: "/crm/verification",
    label: "COD verification",
    icon: ClipboardCheck,
    group: "Workspace",
  },
  { href: "/crm/notifications", label: "Notifications", icon: Bell, group: "Workspace" },
  {
    href: "/crm/verification/settings",
    label: "Verification rules",
    icon: SlidersHorizontal,
    group: "Operations",
  },
  {
    href: "/crm/notifications/delivery",
    label: "Delivery status",
    icon: MailCheck,
    group: "Operations",
  },
] as const;

function currentDestination(path: string) {
  return (
    [...destinations]
      .sort((a, b) => b.href.length - a.href.length)
      .find(({ href }) => path === href || (href !== "/crm" && path.startsWith(`${href}/`))) ??
    destinations[0]
  );
}

function Navigation({ current, close }: { current: string; close?: () => void }) {
  return (
    <nav aria-label="Administrator navigation" className={styles.navigation}>
      {["Workspace", "Operations"].map((group) => (
        <div key={group}>
          <p className={styles.navLabel}>{group}</p>
          {destinations
            .filter((item) => item.group === group)
            .map(({ href, label, icon: Icon }) => (
              <Link
                href={href}
                key={href}
                onClick={close}
                className={styles.navLink}
                aria-current={current === href ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            ))}
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/crm" className={styles.brand} aria-label="DWELLUNE admin overview">
      <Image src="/logo.svg" alt="DWELLUNE Home Décor" width={170} height={72} priority />
    </Link>
  );
}

export function AdminWorkspace({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = currentDestination(pathname);
  const dialog = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  function close() {
    dialog.current?.close();
  }
  useEffect(() => {
    const media = window.matchMedia("(min-width: 64rem)");
    const resize = () => {
      if (media.matches) dialog.current?.close();
    };
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);
  useEffect(() => {
    const guardedContent = dialog.current?.parentElement?.parentElement;
    if (!guardedContent) return;
    const observer = new MutationObserver(() => {
      if (guardedContent.hidden) dialog.current?.close();
    });
    observer.observe(guardedContent, { attributes: true, attributeFilter: ["hidden"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#crm-main">
        Skip to main content
      </a>
      <aside className={styles.sidebar} aria-label="Owner workspace">
        <Brand />
        <div className={styles.ownerBadge}>
          <span className={styles.avatar} aria-hidden="true">
            <UserRound size={18} />
          </span>
          <div>
            <strong>DWELLUNE</strong>
            <span>Owner workspace</span>
          </div>
        </div>
        <Navigation current={active.href} />
        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.navLink}>
            <ArrowUpRight size={18} aria-hidden="true" />
            View storefront
          </Link>
          <Link href="/account" className={styles.navLink}>
            <UserRound size={18} aria-hidden="true" />
            My account
          </Link>
          <div className={styles.ownerIdentity}>
            <span>Store owner</span>
            <strong>{email}</strong>
            <SignOutButton />
          </div>
        </div>
      </aside>
      <div className={styles.stage}>
        <header className={styles.topbar}>
          <button
            ref={menu}
            type="button"
            className={styles.menuButton}
            aria-label="Open admin navigation"
            aria-haspopup="dialog"
            aria-controls="crm-navigation"
            onClick={() => dialog.current?.showModal()}
          >
            <Menu size={21} aria-hidden="true" />
          </button>
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <Link href="/crm">Workspace</Link>
            <span aria-hidden="true">/</span>
            <span>{active.label}</span>
          </nav>
          <div className={styles.headerActions}>
            <NotificationBadge audience="staff" compact />
            <span className={styles.ownerPill}>Owner</span>
          </div>
        </header>
        <div id="crm-main" tabIndex={-1} className={styles.content}>
          {children}
        </div>
        <footer className={styles.footer}>
          <span>DWELLUNE · Owner operations</span>
          <span>Cash on Delivery</span>
        </footer>
      </div>
      <dialog
        ref={dialog}
        id="crm-navigation"
        aria-labelledby="crm-navigation-title"
        className={styles.mobileDialog}
        onClose={() => {
          if (window.matchMedia("(max-width: 63.999rem)").matches) menu.current?.focus();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const items = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((item) => item.getClientRects().length > 0);
          const first = items[0];
          const last = items.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={styles.mobilePanel}>
          <div className={styles.mobileHeading}>
            <h2 id="crm-navigation-title">Admin navigation</h2>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Close admin navigation"
              onClick={close}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <Navigation current={active.href} close={close} />
          <Link href="/" className={styles.navLink} onClick={close}>
            <ArrowUpRight size={18} aria-hidden="true" />
            View storefront
          </Link>
          <Link href="/account" className={styles.navLink} onClick={close}>
            <UserRound size={18} aria-hidden="true" />
            My account
          </Link>
          <div className={styles.ownerIdentity}>
            <span>Store owner</span>
            <strong>{email}</strong>
            <SignOutButton />
          </div>
        </div>
      </dialog>
    </div>
  );
}
