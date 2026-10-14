import styles from "@/components/account/account.module.css";
export default function Loading() {
  return (
    <main className={styles.page} aria-busy="true">
      <p className={styles.eyebrow}>DWELLUNE</p>
      <h1 className={styles.title}>Loading your account…</h1>
      <p role="status">Retrieving your private account details.</p>
    </main>
  );
}
