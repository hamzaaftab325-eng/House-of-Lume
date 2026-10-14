import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { accountOrder, accountSnapshot } from "@/server/account/account.service";
import { ReturnRequestForm } from "@/components/account/account-forms";
import { AccountSessionGuard } from "@/components/account/session-guard";
import styles from "@/components/account/account.module.css";
export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  let data, account;
  try {
    [data, account] = await Promise.all([accountOrder(id), accountSnapshot()]);
  } catch (e) {
    if (e instanceof Error && e.message === "authentication_required") redirect("/auth/signin");
    throw e;
  }
  if (!data) notFound();
  const { order, items, address, history } = data;
  const returnableItems = data.returnableItems.filter(
    (item) =>
      item.quantity > 0 &&
      (!item.product_id || !account.returnPolicy?.excluded_product_ids.includes(item.product_id)),
  );
  const money = (n: number) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(n);
  const eligible =
    account.returnPolicy &&
    order.status === "delivered" &&
    order.delivered_at &&
    account.serverTime >= Date.parse(order.delivered_at) &&
    account.serverTime - Date.parse(order.delivered_at) <=
      account.returnPolicy.window_days * 86400000;
  return (
    <main className={styles.page}>
      <AccountSessionGuard customerId={account.customer.id}>
        <Link href="/account/orders">Back to your orders</Link>
        <p className={styles.eyebrow}>DWELLUNE</p>
        <h1 className={styles.title}>Order #{order.order_number}</h1>
        <p className={styles.status}>{order.status.replaceAll("_", " ")}</p>
        <p>
          <time dateTime={order.placed_at}>
            {new Date(order.placed_at).toLocaleDateString("en-PK", { timeZone: "Asia/Karachi" })}
          </time>{" "}
          · Cash on Delivery
        </p>
        <section className={styles.section}>
          <h2>Order progress</h2>
          {history.length ? (
            <ol className={styles.timeline}>
              {history.map((event) => (
                <li key={event.id}>
                  <strong>{event.to_status.replaceAll("_", " ")}</strong>
                  {" · "}
                  <time dateTime={event.created_at}>
                    {new Date(event.created_at).toLocaleString("en-PK", {
                      timeZone: "Asia/Karachi",
                    })}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <p>Current status: {order.status.replaceAll("_", " ")}</p>
          )}
        </section>
        <section className={styles.section}>
          <h2>Items</h2>
          {items.map((item) => (
            <article className={styles.row} key={item.id}>
              <div>
                <h3>{item.product_name}</h3>
                <p>
                  {item.variant_name} · Quantity {item.quantity}
                </p>
              </div>
              <strong>{money(item.line_total_pkr)}</strong>
            </article>
          ))}
          <dl>
            <dt>Subtotal</dt>
            <dd>{money(order.subtotal_pkr)}</dd>
            <dt>Discount</dt>
            <dd>{money(order.discount_pkr)}</dd>
            <dt>Delivery</dt>
            <dd>{money(order.shipping_pkr)}</dd>
            {order.tax_pkr ? (
              <>
                <dt>Tax</dt>
                <dd>{money(order.tax_pkr)}</dd>
              </>
            ) : null}
            <dt>Total due on delivery</dt>
            <dd>{money(order.total_pkr)}</dd>
          </dl>
        </section>
        {address ? (
          <section className={styles.section}>
            <h2>Delivery address</h2>
            <p>{address.recipient_name}</p>
            <p>
              {[
                address.address_line1,
                address.address_line2,
                address.city,
                address.province,
                address.postal_code,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p>{address.phone}</p>
          </section>
        ) : null}
        {eligible && returnableItems.length > 0 && account.returnPolicy ? (
          <ReturnRequestForm orderId={id} items={returnableItems} policy={account.returnPolicy} />
        ) : (
          <p className={styles.empty}>
            {account.returnPolicy
              ? "This order is not currently eligible for a return request."
              : "Return requests will open once the store's policy is published."}
          </p>
        )}
      </AccountSessionGuard>
    </main>
  );
}
