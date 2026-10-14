import type { Metadata, Route } from "next";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { z } from "zod";
import { orderConfirmation } from "@/server/checkout/checkout.service";
import { DwelluneButtonLink } from "@/components/ui/controls";
import { formatPkr } from "@/lib/product-detail";
import styles from "@/components/checkout/checkout.module.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return <Unavailable />;
  const token = (await cookies()).get("dwellune-guest-cart")?.value;
  const hash =
    token && /^[a-f0-9]{64}$/.test(token) ? createHash("sha256").update(token).digest("hex") : "";
  let order;
  try {
    order = await orderConfirmation(id, hash);
  } catch (e) {
    if (e instanceof Error && ["order_unavailable", "authentication_required"].includes(e.message))
      return <Unavailable />;
    throw e;
  }
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>CASH ON DELIVERY</p>
      <h1 className={styles.title}>Order {order.order_number} received.</h1>
      <p className={styles.banner}>
        {order.status === "cancelled"
          ? "This order has been cancelled."
          : order.verification_status === "pending"
            ? "Your order is saved and awaiting verification. No online payment is required."
            : "Your order is saved. Pay when your order is delivered."}
      </p>
      <div className={styles.layout}>
        <section>
          <h2>Your objects</h2>
          <ul className={styles.lines}>
            {order.lines.map((line, i) => (
              <li key={i} className={styles.item}>
                <div>
                  <strong>{line.name}</strong>
                  <p>
                    {line.variant} · Qty {line.quantity}
                  </p>
                </div>
                <span>{formatPkr(line.line_total_pkr)}</span>
              </li>
            ))}
          </ul>
          <p>
            Keep this order number for support.{" "}
            {order.authenticated
              ? "You can follow progress in your account."
              : "Reopen this confirmation in the same browser to view your order. Signing in or clearing cookies changes access to this guest confirmation."}
          </p>
          <div className={styles.actions}>
            <DwelluneButtonLink href="/shop">Continue shopping</DwelluneButtonLink>
            {order.authenticated ? (
              <DwelluneButtonLink variant="frame" href={`/account/orders/${order.id}` as Route}>
                View order
              </DwelluneButtonLink>
            ) : null}
          </div>
        </section>
        <aside className={styles.summary}>
          <h2>Order total</h2>
          <dl className={styles.totals}>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPkr(order.subtotal_pkr)}</dd>
            </div>
            <div>
              <dt>Discount</dt>
              <dd>−{formatPkr(order.discount_pkr)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>{formatPkr(order.shipping_pkr)}</dd>
            </div>
            {order.tax_pkr > 0 ? (
              <div>
                <dt>Tax</dt>
                <dd>{formatPkr(order.tax_pkr)}</dd>
              </div>
            ) : null}
            <div className={styles.total}>
              <dt>Due on delivery</dt>
              <dd>{formatPkr(order.total_pkr)}</dd>
            </div>
          </dl>
          <p>
            {order.email_status === "sent"
              ? "Confirmation email sent."
              : order.email_status === "failed"
                ? "Your order is saved, but the confirmation email needs attention. Keep your order number and contact support if needed."
                : "Confirmation email queued. Your order is already saved."}
          </p>
        </aside>
      </div>
    </main>
  );
}
function Unavailable() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Order confirmation unavailable.</h1>
      <p>
        Use the browser or signed-in account that placed this order. Do not submit another order if
        you already received an order number.
      </p>
      <DwelluneButtonLink href="/account">Open account</DwelluneButtonLink>
    </main>
  );
}
