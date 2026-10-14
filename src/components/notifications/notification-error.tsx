"use client";
import Link from "next/link";
import { DwelluneButton } from "@/components/ui/controls";
import styles from "@/components/account/account.module.css";
export function NotificationError({ reset }: { reset: () => void }) {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Notifications are unavailable.</h1>
      <p className={styles.intro}>
        Retry loading your inbox. If your session ended, sign in again.
      </p>
      <div className={styles.actions}>
        <DwelluneButton onClick={reset}>Retry notifications</DwelluneButton>
        <Link href="/auth/signin">Sign in again</Link>
      </div>
    </main>
  );
}
