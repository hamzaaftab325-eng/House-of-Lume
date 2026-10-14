import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { verificationDetail } from "@/server/admin/verification.service";
import { staffContactLinks, verificationMoney, verificationDate } from "@/lib/verification";
import { VerificationForm } from "@/components/admin/verification-form";
import styles from "@/components/account/account.module.css";
import adminStyles from "@/components/admin/verification.module.css";
export default async function VerificationOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  let data;
  try {
    data = await verificationDetail(id);
  } catch (error) {
    if (error instanceof Error && error.message === "authentication_required")
      redirect(`/auth/signin?next=${encodeURIComponent(`/crm/verification/${id}`)}`);
    if (error instanceof Error && error.message === "order_unavailable") notFound();
    throw error;
  }
  const { order, address } = data;
  const links = staffContactLinks(
    order.contact_phone,
    order.contact_whatsapp,
    order.contact_email,
    order.order_number,
  );
  return (
    <main className={styles.page}>
      <Link href="/crm/verification">Back to verification queue</Link>
      <h1 className={styles.title}>Order #{order.order_number}</h1>
      <p className={styles.status}>
        {order.status.replaceAll("_", " ")} · Verification:{" "}
        {order.verification_status.replaceAll("_", " ")}
      </p>
      <p>
        <time dateTime={order.placed_at}>{verificationDate(order.placed_at)}</time> · Cash on
        Delivery · Settlement: {order.cod_settlement_status.replaceAll("_", " ")}
      </p>
      <section className={styles.section}>
        <h2>Manual review</h2>
        <p>{data.review.status.replaceAll("_", " ")}</p>
        {data.review.flags.length ? (
          <>
            <p className={styles.intro}>
              Review each recorded signal with the customer before deciding. These are recorded rule
              matches.
            </p>
            <ul>
              {data.review.flags.map((flag) => (
                <li key={flag.code}>
                  <strong>{flag.label}</strong>
                  <p>
                    {flag.code === "high_value"
                      ? `Threshold: ${verificationMoney(flag.threshold)}`
                      : `Recorded count: ${flag.count} · Threshold: ${flag.threshold}`}
                    {flag.window
                      ? ` · Window: ${flag.window} ${flag.code === "possible_duplicate" ? "hours" : "days"}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>No review flags were recorded for this order.</p>
        )}
        {data.review.note ? <p className={adminStyles.note}>{data.review.note}</p> : null}
        {data.review.reviewed_at ? (
          <p>
            Cleared by {data.review.reviewed_by} ·{" "}
            <time dateTime={data.review.reviewed_at}>
              {verificationDate(data.review.reviewed_at)}
            </time>
          </p>
        ) : null}
      </section>
      <div className={styles.grid}>
        <section className={styles.section}>
          <h2>Customer and delivery</h2>
          <p>{order.contact_name}</p>
          <p>{order.contact_phone}</p>
          <p>{order.contact_email ?? "No email recorded"}</p>
          {address ? (
            <p className={adminStyles.note}>
              {[
                address.recipient_name,
                address.line1,
                address.line2,
                address.city,
                address.province,
                address.postal_code,
              ]
                .filter(Boolean)
                .join("\n")}
            </p>
          ) : (
            <p>No delivery address recorded.</p>
          )}
          <div className={styles.actions}>
            {links.phone ? <a href={links.phone}>Call customer</a> : null}
            {links.whatsapp ? (
              <a href={links.whatsapp} target="_blank" rel="noopener noreferrer">
                Open WhatsApp
              </a>
            ) : null}
            {links.email ? <a href={links.email}>Compose email</a> : null}
          </div>
          <p className={styles.intro}>
            These links open your contact app. Record the actual outcome below; opening a link does
            not send a message or verify the order.
          </p>
          {order.customer_note ? (
            <>
              <h3>Customer note</h3>
              <p className={adminStyles.note}>{order.customer_note}</p>
            </>
          ) : null}
        </section>
        <section className={styles.section}>
          <h2>Order summary</h2>
          {!data.items.length ? (
            <p>No item snapshot is recorded for this order. Review it before making a decision.</p>
          ) : null}
          {data.items.map((item) => (
            <div className={styles.row} key={item.id}>
              <div>
                <h3>{item.product_name}</h3>
                <p>
                  {item.variant_name} · {item.sku} · Quantity {item.quantity}
                </p>
              </div>
              <strong>{verificationMoney(item.line_total_pkr)}</strong>
            </div>
          ))}
          <dl className={adminStyles.totals}>
            <dt>Subtotal</dt>
            <dd>{verificationMoney(order.subtotal_pkr)}</dd>
            <dt>Discount</dt>
            <dd>{verificationMoney(order.discount_pkr)}</dd>
            <dt>Delivery</dt>
            <dd>{verificationMoney(order.shipping_pkr)}</dd>
            {order.tax_pkr ? (
              <>
                <dt>Tax</dt>
                <dd>{verificationMoney(order.tax_pkr)}</dd>
              </>
            ) : null}
            <dt>Due on delivery</dt>
            <dd>{verificationMoney(order.total_pkr)}</dd>
          </dl>
        </section>
      </div>
      <section className={styles.section}>
        <h2>Verification action</h2>
        <VerificationForm
          key={order.verification_revision}
          orderId={order.id}
          revision={order.verification_revision}
          canVerify={data.can_verify}
          canCancel={data.can_cancel}
          reviewStatus={data.review.status}
        />
      </section>
      <section className={styles.section}>
        <h2>Contact and verification history</h2>
        {data.attempts.length ? (
          <ol className={styles.timeline}>
            {data.attempts.map((attempt) => (
              <li key={attempt.id}>
                <strong>
                  Attempt {attempt.attempt_number} ·{" "}
                  {(attempt.staff_action ?? "Initial verification").replaceAll("_", " ")}
                </strong>
                <p>
                  {(attempt.contact_channel ?? attempt.method).replaceAll("_", " ")}
                  {attempt.contact_outcome
                    ? ` · ${attempt.contact_outcome.replaceAll("_", " ")}`
                    : ""}{" "}
                  · {attempt.status.replaceAll("_", " ")}
                </p>
                <p className={adminStyles.note}>{attempt.note}</p>
                <p>
                  {attempt.staff_name ?? (attempt.initiated_by ? "Staff member" : "System")}
                  {attempt.verified_by
                    ? ` · Verified by ${attempt.staff_name ?? attempt.verified_by}`
                    : ""}
                </p>
                <time dateTime={attempt.created_at}>{verificationDate(attempt.created_at)}</time>
                {attempt.verified_at ? (
                  <p>
                    Verified:{" "}
                    <time dateTime={attempt.verified_at}>
                      {verificationDate(attempt.verified_at)}
                    </time>
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p>No contact attempts recorded.</p>
        )}
      </section>
      <section className={styles.section}>
        <h2>Order progress</h2>
        {!data.history.length ? (
          <p>Current status: {order.status.replaceAll("_", " ")}. No status changes recorded.</p>
        ) : null}
        <ol className={styles.timeline}>
          {data.history.map((event) => (
            <li key={event.id}>
              <strong>{event.to_status.replaceAll("_", " ")}</strong> ·{" "}
              <time dateTime={event.created_at}>{verificationDate(event.created_at)}</time>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
