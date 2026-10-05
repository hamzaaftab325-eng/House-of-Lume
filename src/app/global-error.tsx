"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="foundation-page">
          <div className="site-shell reading-width">
            <p className="foundation-kicker">House of Lume</p>
            <h1 className="foundation-title">The application hit an unexpected error.</h1>
            <div className="foundation-links">
              <button className="foundation-link" type="button" onClick={reset}>
                Retry
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
