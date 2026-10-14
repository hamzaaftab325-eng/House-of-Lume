import Link from "next/link";
import type { Route } from "next";
import styles from "@/components/account/account.module.css";
export default function LinkError() {
  return (
    <main className={`${styles.page} ${styles.auth}`}>
      <p className={styles.eyebrow}>DWELLUNE</p>
      <h1 className={styles.title}>This link could not be verified.</h1>
      <p className={styles.intro}>
        The link may have expired or already been used. Request a fresh link to continue.
      </p>
      <nav className={styles.actions} aria-label="Account recovery">
        <Link href={"/auth/reset" as Route}>Reset password</Link>
        <Link href={"/auth/resend" as Route}>Verify email</Link>
        <Link href={"/auth/signin" as Route}>Sign in</Link>
      </nav>
    </main>
  );
}
