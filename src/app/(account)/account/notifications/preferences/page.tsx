import Link from "next/link";
import { redirect } from "next/navigation";
import { notificationPreferences } from "@/server/notifications/controls.service";
import { notificationIdentity } from "@/server/notifications/notifications.service";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";
import { AccountSessionGuard } from "@/components/account/session-guard";
import styles from "@/components/account/account.module.css";
export default async function Page() {
  let identity, preferences;
  try {
    identity = await notificationIdentity("customer");
    preferences = await notificationPreferences();
  } catch (e) {
    if (e instanceof Error && e.message === "authentication_required")
      redirect("/auth/signin?next=%2Faccount%2Fnotifications%2Fpreferences");
    throw e;
  }
  return (
    <main className={styles.page}>
      <AccountSessionGuard
        customerId={identity.customerId}
        sessionEndpoint="/api/notifications?audience=customer&summary=1"
      >
        <Link href="/account/notifications">Back to notifications</Link>
        <h1 className={styles.title}>Notification preferences.</h1>
        <NotificationPreferencesForm preferences={preferences} />
      </AccountSessionGuard>
    </main>
  );
}
