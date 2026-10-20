import styles from "@/components/admin/workspace.module.css";
export default function Loading() {
  return (
    <main className={styles.state} role="status" aria-live="polite">
      <h1>Loading workspace</h1>
      <p>Checking your operational information…</p>
    </main>
  );
}
