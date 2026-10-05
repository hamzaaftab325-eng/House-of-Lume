import Link from "next/link";

export default function NotFound() {
  return (
    <main className="foundation-page">
      <div className="site-shell reading-width">
        <p className="foundation-kicker">404</p>
        <h1 className="foundation-title">This page is not in the room.</h1>
        <p className="foundation-copy">The destination may have moved or may no longer exist.</p>
        <div className="foundation-links">
          <Link className="foundation-link" href="/">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
