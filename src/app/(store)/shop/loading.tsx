import styles from "@/components/catalogue/catalogue.module.css";

export default function ShopLoading() {
  return (
    <main className={styles.loading} aria-busy="true" aria-label="Loading catalogue">
      <div className={styles.loadingInner}>
        <p>House of Lume</p>
        <div aria-hidden="true" />
        <span>Preparing the catalogue…</span>
      </div>
    </main>
  );
}
