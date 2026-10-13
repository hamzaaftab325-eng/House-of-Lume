import styles from "./product-route.module.css";

export default function ProductLoading() {
  return (
    <main className={styles.loadingPage} aria-busy="true" aria-label="Loading product">
      <div className={styles.loadingGallery} aria-hidden="true" />
      <div className={styles.loadingPanel} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <p>Preparing the object…</p>
    </main>
  );
}
