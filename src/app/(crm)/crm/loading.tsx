import styles from "@/components/account/account.module.css";
export default function Loading() {
  return (
    <main className={styles.page} role="status" aria-live="polite">
      <p className={styles.intro}>Loading administrator workspace…</p>
    </main>
  );
}
