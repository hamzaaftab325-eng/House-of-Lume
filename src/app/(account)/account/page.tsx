import Link from "next/link";

export default function AccountFoundationPage() {
  return (
    <main className="foundation-page">
      <div className="site-shell reading-width">
        <p className="foundation-kicker">Customer Account Route Group</p>
        <h1 className="foundation-title">Account foundation.</h1>
        <p className="foundation-copy">
          Authentication, orders, returns, wishlist synchronization, and the customer notification
          center will be implemented in their planned phases.
        </p>
        <div className="foundation-links">
          <Link className="foundation-link" href="/">
            Return to storefront
          </Link>
        </div>
      </div>
    </main>
  );
}
