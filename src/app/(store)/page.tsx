import Link from "next/link";

export default function StorefrontHomePage() {
  return (
    <main className="foundation-page">
      <div className="site-shell">
        <p className="foundation-kicker">House of Lume · Production Foundation</p>
        <h1 className="foundation-title">Objects for a warmer home.</h1>
        <p className="foundation-copy">
          Phase 0 establishes the production architecture for a COD-first commerce platform and
          operations CRM. The final storefront experience will be built from the Luminous
          Domesticity design system, not from a generic ecommerce template.
        </p>
        <nav className="foundation-links" aria-label="Foundation routes">
          <Link className="foundation-link" href="/account">
            Customer account
          </Link>
          <Link className="foundation-link" href="/crm">
            Commerce CRM
          </Link>
        </nav>
        <div className="foundation-status" aria-label="Foundation status">
          <span>Next.js App Router</span>
          <span>Cash on Delivery launch model</span>
          <span>WCAG 2.2 AA target</span>
        </div>
      </div>
    </main>
  );
}
