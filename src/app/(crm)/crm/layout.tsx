import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminIdentity } from "@/server/admin/admin.service";
import { AccountSessionGuard } from "@/components/account/session-guard";
import { SignOutButton } from "@/components/account/account-forms";
import { AdminNavigation } from "@/components/admin/admin-navigation";
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
    if (code === "admin_access_required")
      return (
        <main className="foundation-page">
          <div className="site-shell reading-width">
            <h1 className="foundation-title">Administrator access required.</h1>
            <p>Your account does not have administrator access.</p>
            <Link href="/account">Open your account</Link>
          </div>
        </main>
      );
    throw error;
  }
  return (
    <AccountSessionGuard userId={admin.userId} sessionEndpoint="/api/admin/session">
      <a className={styles.skipLink} href="#crm-main">Skip to main content</a>
      <header className={styles.header}>
        <AdminNavigation />
        <div className={styles.adminActions}>
          <span className={styles.identity}>{admin.email}</span>
          <Link href="/account">My account</Link>
          <SignOutButton />
        </div>
      </header>
      <div id="crm-main" tabIndex={-1}>{children}</div>
    </AccountSessionGuard>
  );
}
