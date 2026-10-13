"use client";

import styles from "./catalogue.module.css";

export function CatalogueError({ reset }: { reset: () => void }) {
  return (
    <main className={styles.page}>
      <section className={styles.errorState}>
        <p className={styles.emptyEyebrow}>The shelf went quiet</p>
        <h1>We could not load this catalogue view.</h1>
        <p>
          The request did not complete safely. Retry the catalogue, or return to the House of Lume
          home page.
        </p>
        <div className={styles.emptyActions}>
          <button type="button" onClick={reset}>
            Try again
          </button>
          <a href="/">Return home</a>
        </div>
      </section>
    </main>
  );
}
