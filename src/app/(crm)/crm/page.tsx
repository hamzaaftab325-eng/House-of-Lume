import Link from "next/link";

export default function CrmFoundationPage() {
  return (
    <main className="foundation-page">
      <div className="site-shell reading-width">
        <p className="foundation-kicker">Internal Commerce Operations Route Group</p>
        <h1 className="foundation-title">CRM foundation.</h1>
        <p className="foundation-copy">
          Order operations, COD verification, fulfillment, notifications, inventory, RTO, returns,
          reconciliation, analytics, and staff authorization will be implemented behind protected
          server-side permissions.
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
