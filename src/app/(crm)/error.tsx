"use client";
import Link from "next/link";
import { DwelluneButton } from "@/components/ui/controls";
import styles from "@/components/account/account.module.css";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>The workspace is unavailable.</h1>
      <p className={styles.intro}>
        Retry or sign in again. No order details are displayed while access cannot be verified.
      </p>
      <div className={styles.actions}>
        <DwelluneButton onClick={reset}>Retry</DwelluneButton>
        <Link href="/auth/signin?next=%2Fcrm">Sign in again</Link>
      </div>
    </main>
  );
}
