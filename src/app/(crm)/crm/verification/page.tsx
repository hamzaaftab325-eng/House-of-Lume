import Link from "next/link";
import type { Route } from "next";
import { z } from "zod";
import { redirect } from "next/navigation";
import {
  queueFilterSchema,
  queueFilters,
  verificationMoney,
  verificationDate,
} from "@/lib/verification";
import { verificationQueue } from "@/server/admin/verification.service";
import styles from "@/components/account/account.module.css";
import adminStyles from "@/components/admin/verification.module.css";
export default async function VerificationQueue({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; before?: string }>;
}) {
  const params = await searchParams;
  const filter = queueFilterSchema.catch("pending").parse(params.filter);
  const before = z.uuid().safeParse(params.before);
  let data;
  try {
    data = await verificationQueue(filter, before.success ? before.data : null);
  } catch (error) {
    if (error instanceof Error && error.message === "authentication_required")
      redirect("/auth/signin?next=%2Fcrm%2Fverification");
    throw error;
  }
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Cash on Delivery · Staff review</p>
      <h1 className={styles.title}>Verification queue.</h1>
      <p className={styles.intro}>
        Contact the customer, record what happened, and verify the order before fulfillment. Amounts
        are due on delivery.
      </p>
      <nav className={styles.nav} aria-label="Verification filters">
        {queueFilters.map((value) => (
          <Link
            key={value}
            href={`/crm/verification?filter=${value}` as Route}
            aria-current={filter === value ? "page" : undefined}
          >
            {value === "pending"
              ? "Awaiting verification"
              : value === "all"
                ? "All orders"
                : value[0].toUpperCase() + value.slice(1)}
          </Link>
        ))}
      </nav>
      {data.items.length ? (
        <ol className={adminStyles.queue}>
          {data.items.map((order) => (
            <li key={order.id} className={adminStyles.queueRow}>
              <div>
                <Link
                  className={adminStyles.orderLink}
                  href={`/crm/verification/${order.id}` as Route}
                >
                  Order #{order.order_number}
                </Link>
                <p>
                  {order.contact_name} · {order.city ?? "Address unavailable"}
                </p>
                <p>{order.contact_phone}</p>
                <time dateTime={order.placed_at}>{verificationDate(order.placed_at)}</time>
              </div>
              <div>
                <strong>{verificationMoney(order.total_pkr)}</strong>
                <p>{order.status.replaceAll("_", " ")}</p>
                <p>Verification: {order.verification_status.replaceAll("_", " ")}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.empty}>
          No orders in this view. New COD orders will appear here when checkout opens.
        </p>
      )}
      <div className={styles.actions}>
        {params.before ? (
          <Link href={`/crm/verification?filter=${filter}` as Route}>Back to newest orders</Link>
        ) : null}
        {data.next_cursor ? (
          <Link href={`/crm/verification?filter=${filter}&before=${data.next_cursor}` as Route}>
            Older orders
          </Link>
        ) : null}
      </div>
    </main>
  );
}
