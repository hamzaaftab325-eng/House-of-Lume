"use client";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="foundation-page">
      <div className="site-shell reading-width">
        <p className="foundation-kicker">Something went wrong</p>
        <h1 className="foundation-title">We could not load this view.</h1>
        <p className="foundation-copy">
          Retry the request. If the problem continues, it should be captured by the production
          observability layer.
        </p>
        <div className="foundation-links">
          <button className="foundation-link" type="button" onClick={reset}>
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
