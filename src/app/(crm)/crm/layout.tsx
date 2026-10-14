import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminIdentity } from "@/server/admin/admin.service";
import { AccountSessionGuard } from "@/components/account/session-guard";
import { SignOutButton } from "@/components/account/account-forms";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import styles from "@/components/admin/verification.module.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administrator workspace",
  robots: { index: false, follow: false },
};
export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  let admin;
  try {
    admin = await adminIdentity();
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "authentication_required") redirect("/auth/signin?next=%2Fcrm");
    if (code === "staff_access_required")
      return (
        <main className="foundation-page">
          <div className="site-shell reading-width">
            <h1 className="foundation-title">Staff access required.</h1>
            <p>Your account does not have administrator access.</p>
            <NotificationBadge audience="staff" />
            <Link href="/account">Open your account</Link>
          </div>
        </main>
      );
    throw error;
  }
  return (
    <AccountSessionGuard customerId={admin.customerId} sessionEndpoint="/api/admin/session">
      <header className={styles.header}>
        <nav aria-label="Administrator navigation">
          <Link href="/crm">DWELLUNE admin</Link>
          <Link href={"/crm/verification" as Route}>COD verification</Link>
          <Link href={"/crm/verification/settings" as Route}>Verification rules</Link>
          <NotificationBadge audience="staff" />
          <Link href="/account">My account</Link>
        </nav>
        <span className={styles.identity}>{admin.email}</span>
        <SignOutButton />
      </header>
      {children}
    </AccountSessionGuard>
  );
}
