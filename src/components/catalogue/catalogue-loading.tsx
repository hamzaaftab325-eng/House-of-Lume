import styles from "./catalogue.module.css";

export function CatalogueLoading() {
  return (
    <main className={styles.page} aria-busy="true" aria-label="Loading catalogue">
      <header className={`${styles.hero} ${styles.loadingHero}`}>
        <div className={styles.heroInner}>
          <div className={styles.loadingLine} />
          <div className={styles.loadingTitle} />
          <div className={styles.loadingCount} />
        </div>
      </header>
      <div className={styles.loadingShell}>
        <div className={styles.loadingFilters} />
        <div className={styles.loadingGrid}>
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={styles.loadingCard}>
              <div />
              <span />
              <span />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
