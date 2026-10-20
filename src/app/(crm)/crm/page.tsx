import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Wallet,
  ShoppingBag,
  ClipboardCheck,
  MailCheck,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { verificationQueue } from "@/server/admin/verification.service";
import { notificationUnread } from "@/server/notifications/notifications.service";
import { verificationDate, verificationMoney } from "@/lib/verification";
import { DwelluneButtonLink } from "@/components/ui/controls";
import styles from "@/components/admin/workspace.module.css";

export default async function CrmPage() {
  const [queue, notifications] = await Promise.all([
    verificationQueue("pending", null),
    notificationUnread("staff"),
  ]);
  const preview = queue.items.slice(0, 5);
  const manual = preview.filter((order) => order.review_status === "pending").length;
  const contact = preview.length - manual;
  const previewValue = preview.reduce((total, order) => total + order.total_pkr, 0);
  const manualArc = preview.length ? (manual / preview.length) * 100 : 0;
  return (
    <main className={styles.overview}>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>DWELLUNE · OWNER DASHBOARD</p>
          <h1>Store overview</h1>
          <p>A clear view of your store’s verification and operations.</p>
        </div>
        <DwelluneButtonLink href="/crm/verification" size="compact">
          Open verification queue
        </DwelluneButtonLink>
      </div>
      <dl className={styles.metricStrip}>
        <div>
          <dt>
            <Bell size={18} aria-hidden="true" />
            Unread notifications
          </dt>
          <dd>{notifications.unread.toLocaleString("en-PK")}</dd>
          <Link href="/crm/notifications?read=unread">
            Review inbox <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div>
          <dt>
            <ClipboardCheck size={18} aria-hidden="true" />
            Queue preview
          </dt>
          <dd>
            {preview.length}
            <span> shown</span>
          </dd>
          <p>Up to 5 awaiting verification</p>
        </div>
        <div>
          <dt>
            <Wallet size={18} aria-hidden="true" />
            Preview order value
          </dt>
          <dd className={styles.moneyMetric}>{verificationMoney(previewValue)}</dd>
          <p>Value of the {preview.length} shown requests; not revenue.</p>
        </div>
        <div>
          <dt>
            <ShoppingBag size={18} aria-hidden="true" />
            Payment model
          </dt>
          <dd className={styles.textMetric}>Cash on Delivery</dd>
          <p>Collection and settlement are separate.</p>
        </div>
      </dl>
      <div className={styles.overviewGrid}>
        <section className={styles.panel} aria-labelledby="queue-title">
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.eyebrow}>ORDER REVIEW</p>
              <h2 id="queue-title">Awaiting verification</h2>
            </div>
            <Link href="/crm/verification">
              View queue <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <p className={styles.caption}>
            A preview of pending requests, not a total order count. Open the queue for all available
            pages.
          </p>
          {preview.length ? (
            <div
              className={styles.tableScroll}
              role="region"
              aria-label="Pending order preview"
              tabIndex={0}
            >
              <table className={styles.table}>
                <caption className={styles.srOnly}>
                  Up to five orders awaiting COD verification
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Placed</th>
                    <th scope="col">Total</th>
                    <th scope="col">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link href={`/crm/verification/${order.id}`}>#{order.order_number}</Link>
                      </td>
                      <td>
                        {order.contact_name}
                        <small>{order.city ?? "Address unavailable"}</small>
                      </td>
                      <td>
                        <time dateTime={order.placed_at}>{verificationDate(order.placed_at)}</time>
                      </td>
                      <td>{verificationMoney(order.total_pkr)}</td>
                      <td>
                        <span className={styles.status}>
                          {order.review_status === "pending" ? "Manual review" : "Awaiting contact"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.empty}>
              <ClipboardCheck size={28} aria-hidden="true" />
              <h3>No requests awaiting verification</h3>
              <p>
                New pending COD requests will appear here. You can still review previous orders in
                the queue.
              </p>
              <Link href="/crm/verification?filter=all">View all verification orders</Link>
            </div>
          )}
          <div className={styles.panelFoot}>
            <ShieldCheck size={16} aria-hidden="true" />
            <p>
              Confirm customer details before fulfillment. Order values are amounts due on delivery.
            </p>
          </div>
        </section>
        <section className={styles.panel} aria-labelledby="breakdown-title">
          <div className={styles.panelHeading}>
            <h2 id="breakdown-title">Verification breakdown</h2>
            <span className={styles.tag}>Preview only</span>
          </div>
          <p className={styles.caption}>
            Review state of the same {preview.length} shown requests.
          </p>
          <div className={styles.breakdown}>
            <div className={styles.donut}>
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle className={styles.donutTrack} cx="60" cy="60" r="46" />
                {preview.length ? (
                  <>
                    <circle className={styles.donutContact} cx="60" cy="60" r="46" />
                    <circle
                      className={styles.donutManual}
                      cx="60"
                      cy="60"
                      r="46"
                      pathLength="100"
                      strokeDasharray={`${manualArc} ${100 - manualArc}`}
                    />
                  </>
                ) : null}
              </svg>
              <div>
                <strong>{preview.length}</strong>
                <span>SHOWN REQUESTS</span>
              </div>
            </div>
            <dl className={styles.legend}>
              <div>
                <dt>
                  <span className={styles.manualDot} />
                  Manual review
                </dt>
                <dd>{manual}</dd>
              </div>
              <div>
                <dt>
                  <span className={styles.contactDot} />
                  Awaiting contact
                </dt>
                <dd>{contact}</dd>
              </div>
            </dl>
          </div>
          <div className={styles.operatingNote}>
            <ShieldCheck size={20} aria-hidden="true" />
            <div>
              <h3>{preview.length ? "Review before fulfillment" : "Your preview is clear"}</h3>
              <p>
                {preview.length
                  ? "Confirm customer details and record each decision in the verification queue."
                  : "No pending requests in this preview. New COD verification requests will appear here."}
              </p>
            </div>
          </div>
          <div className={styles.panelFoot}>
            <p>This is a bounded preview, not a store-wide order or fulfillment report.</p>
          </div>
        </section>
      </div>
      <div className={styles.lowerGrid}>
        <section className={styles.panel} aria-labelledby="actions-title">
          <div className={styles.panelHeading}>
            <h2 id="actions-title">Action center</h2>
            <span className={styles.tag}>Owner only</span>
          </div>
          <div className={styles.actionList}>
            <Link href="/crm/verification">
              <ClipboardCheck aria-hidden="true" />
              <div>
                <strong>Review COD requests</strong>
                <p>Record contact and verification decisions.</p>
              </div>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/crm/verification/settings">
              <SlidersHorizontal aria-hidden="true" />
              <div>
                <strong>Verification rules</strong>
                <p>Manage policy and manual-review rules.</p>
              </div>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/crm/notifications/delivery">
              <MailCheck aria-hidden="true" />
              <div>
                <strong>Notification delivery</strong>
                <p>Check worker health and email acceptance.</p>
              </div>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className={styles.panel} aria-labelledby="readiness-title">
          <div className={styles.panelHeading}>
            <h2 id="readiness-title">Launch readiness</h2>
            <span className={styles.status}>Checkout closed</span>
          </div>
          <div className={styles.readinessBody}>
            <span className={styles.featureIcon}>
              <ShoppingBag size={24} aria-hidden="true" />
            </span>
            <h3>Operations before launch</h3>
            <p>
              Checkout remains closed pending real product and launch acceptance. Keep customer
              contact and verification records up to date.
            </p>
            <Link href="/crm/verification/settings">
              Review verification policy <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className={styles.panel} aria-labelledby="notices-title">
          <div className={styles.panelHeading}>
            <h2 id="notices-title">Operational notices</h2>
            <Bell size={18} aria-hidden="true" />
          </div>
          <div className={styles.readinessBody}>
            <strong className={styles.noticeCount}>
              {notifications.unread.toLocaleString("en-PK")}
              <span> unread</span>
            </strong>
            <p>
              Review persisted store alerts, verification updates and notification delivery notices
              in your inbox.
            </p>
            <Link href="/crm/notifications">
              Open operational notices <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <div className={styles.paymentNote}>
              <ShieldCheck size={16} aria-hidden="true" />
              Cash on Delivery only
            </div>
          </div>
        </section>
      </div>
      <section className={styles.noteBand} aria-labelledby="privacy-title">
        <ShieldCheck size={21} aria-hidden="true" />
        <div>
          <h2 id="privacy-title">A private workspace for your store</h2>
          <p>
            Access is tied to your owner session. Sign out when you finish using a shared device.
          </p>
        </div>
        <Link href="/account">
          Manage my account <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
