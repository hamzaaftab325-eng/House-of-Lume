import Link from "next/link";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { deliveryFilterSchema } from "@/lib/notification-controls";
import { notificationOperations } from "@/server/notifications/controls.service";
import { verificationDate } from "@/lib/verification";
import styles from "@/components/account/account.module.css";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const status = deliveryFilterSchema.catch("all").parse((await searchParams).status);
  let data;
  try {
    data = await notificationOperations(status);
  } catch (error) {
    if (error instanceof Error && error.message === "authentication_required")
      redirect("/auth/signin?next=%2Fcrm%2Fnotifications%2Fdelivery");
    throw error;
  }
  return (
    <main className={styles.page}>
      <Link href="/crm/notifications">Back to admin notifications</Link>
      <h1 className={styles.title}>Notification delivery.</h1>
      <p className={styles.intro}>
        In-app notices become available when their database transaction commits. Read status is
        separate. Email “sent” means SMTP accepted the message; it does not confirm inbox delivery.
      </p>
      <section className={styles.section}>
        <h2>Email worker</h2>
        <p>
          Last SMTP check:{" "}
          {data.health.error
            ? "Failed"
            : data.health.verified_at
              ? "Success recorded (see timestamp)"
              : "Not recorded"}
        </p>
        <p>
          Last SMTP verification:{" "}
          {data.health.verified_at
            ? verificationDate(data.health.verified_at)
            : "No successful verification recorded"}
        </p>
        <p>
          Last worker invocation:{" "}
          {data.health.last_run_at ? verificationDate(data.health.last_run_at) : "Not recorded"}
        </p>
        {data.health.error ? (
          <p role="status">Health issue: {data.health.error.replaceAll("_", " ")}</p>
        ) : null}
        <p>
          Pending: {data.counts.pending} · Sending: {data.counts.sending} · Failed:{" "}
          {data.counts.failed} · Accepted by SMTP: {data.counts.sent}
        </p>
        <p className={styles.intro}>
          Temporary failures use bounded retries. Uncertain SMTP acceptance requires checking the
          sender mailbox before any resend. This screen does not resend email.
        </p>
      </section>
      <nav className={styles.nav} aria-label="Delivery status filters">
        {deliveryFilterSchema.options.map((x) => (
          <Link
            key={x}
            href={`/crm/notifications/delivery?status=${x}` as Route}
            aria-current={status === x ? "page" : undefined}
          >
            {x[0].toUpperCase() + x.slice(1)}
          </Link>
        ))}
      </nav>
      <p className={styles.intro}>
        Latest 20 jobs matching this filter. Counts cover the full queue.
      </p>
      {data.jobs.length ? (
        data.jobs.map((job) => (
          <article className={styles.row} key={job.id}>
            <div>
              <h2>
                <Link href={`/crm/verification/${job.order_id}` as Route}>Open order</Link>
              </h2>
              <p>
                {job.event} · Template {job.version}
              </p>
              <p>
                {job.status} · Attempts: {job.attempts}
              </p>
              {job.error ? (
                <p>
                  {job.error === "smtp_uncertain"
                    ? "Acceptance uncertain — inspect the sender mailbox; automatic resend is blocked."
                    : job.error.replaceAll("_", " ")}
                </p>
              ) : null}
              <p>
                Scheduled/lease time:{" "}
                <time dateTime={job.next_attempt}>{verificationDate(job.next_attempt)}</time>
              </p>
            </div>
          </article>
        ))
      ) : (
        <p className={styles.empty}>No email jobs in this view.</p>
      )}
      <section className={styles.section}>
        <h2>Event registry</h2>
        <p className={styles.intro}>
          Active entries have a real producer. Deferred entries require the named workflow and do
          not emit notices yet.
        </p>
        {data.types.map((t) => (
          <article className={styles.row} key={`${t.key}/${t.audience}`}>
            <div>
              <h3>{t.key}</h3>
              <p>
                {t.audience} · {t.category} · {t.state} · {t.required ? "Essential" : "Optional"}
              </p>
              {t.dependency ? <p>Waiting for: {t.dependency}</p> : null}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
