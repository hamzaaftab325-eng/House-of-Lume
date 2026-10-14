"use client";
import Link from "next/link";
import { DwelluneButton } from "@/components/ui/controls";
import styles from "@/components/account/account.module.css";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>DWELLUNE</p>
      <h1 className={styles.title}>We could not load your account.</h1>
      <p className={styles.intro}>Please retry. If your session has expired, sign in again.</p>
      <div className={styles.actions}>
        <DwelluneButton onClick={reset}>Retry</DwelluneButton>
        <Link href="/auth/signin">Sign in again</Link>
      </div>
    </main>
  );
}
