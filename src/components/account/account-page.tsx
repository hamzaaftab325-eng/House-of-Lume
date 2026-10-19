import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { accountSnapshot } from "@/server/account/account.service";
import { AuthForm } from "./auth-form";
import { AddressEntry, AddressForm, ProfileForm, SignOutButton } from "./account-forms";
import { AccountSessionGuard } from "./session-guard";
import styles from "./account.module.css";

export const sections = {
  profile: "Profile",
  addresses: "Address book",
  orders: "Your orders",
  notifications: "Notifications",
  returns: "Returns",
  settings: "Account settings",
};
export type AccountSection = Exclude<keyof typeof sections, "notifications">;
const money = (n: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);
export async function AccountPage({
  section,
  page: rawPage,
}: {
  section: AccountSection;
  page?: string;
}) {
  const page = Math.floor(Math.max(1, Math.min(1000, Number(rawPage) || 1)));
  let data;
  try {
    data = await accountSnapshot(page);
  } catch (e) {
    if (e instanceof Error && e.message === "authentication_required")
      redirect(
        `/auth/signin?next=${encodeURIComponent(section === "profile" ? "/account" : `/account/${section}`)}` as Route,
      );
    throw e;
  }
  const title = sections[section];
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>DWELLUNE · Your account</p>
      <h1 className={styles.title}>{title}</h1>
      <AccountSessionGuard customerId={data.customer.id}>
        <p className={styles.intro}>Signed in as {data.email}</p>
        <nav className={styles.nav} aria-label="Account navigation">
          {Object.entries(sections).map(([key, label]) => (
            <Link
              key={key}
              href={(key === "profile" ? "/account" : `/account/${key}`) as Route}
              aria-current={key === section ? "page" : undefined}
            >
              {label}
              {key === "notifications" && data.unread > 0 ? ` (${data.unread})` : ""}
            </Link>
          ))}
          <Link href="/wishlist">Saved objects</Link>
          <Link href="/cart">Shopping bag</Link>
        </nav>
        {section === "profile" ? (
          <>
            <p className={styles.intro}>Keep your contact information up to date.</p>
            <ProfileForm customer={data.customer} />
          </>
        ) : null}
        {section === "addresses" ? (
          <>
            <p className={styles.intro}>Your saved addresses are available only to your account.</p>
            {data.addresses.length === 0 ? (
              <p className={styles.empty}>No saved addresses yet.</p>
            ) : (
              data.addresses.map((address) => <AddressEntry key={address.id} address={address} />)
            )}
            <section className={styles.section}>
              <h2>Add a Pakistan delivery address</h2>
              <AddressForm />
            </section>
          </>
        ) : null}
        {section === "orders" ? (
          <>
            {data.orders.length ? (
              data.orders.map((order) => (
                <article className={styles.row} key={order.id}>
                  <div>
                    <h2>
                      <Link href={`/account/orders/${order.id}` as Route}>
                        Order #{order.order_number}
                      </Link>
                    </h2>
                    <p>
                      <time dateTime={order.placed_at}>
                        {new Date(order.placed_at).toLocaleDateString("en-PK", {
                          timeZone: "Asia/Karachi",
                        })}
                      </time>
                    </p>
                    <p className={styles.status}>{order.status.replaceAll("_", " ")}</p>
                  </div>
                  <strong>{money(order.total_pkr)}</strong>
                </article>
              ))
            ) : (
              <div className={styles.empty}>
                <h2>No orders yet.</h2>
                <p>Your actual orders will appear here once order placement opens.</p>
                <Link href="/shop">Explore the catalogue</Link>
              </div>
            )}
            {data.orderCount > page * 20 ? (
              <Link href={`/account/orders?page=${page + 1}` as Route}>Next orders</Link>
            ) : null}
          </>
        ) : null}
        {section === "returns" ? (
          <>
            <p className={styles.intro}>
              {data.returnPolicy
                ? `Eligible returns can be requested from the order detail within ${data.returnPolicy.window_days} days of delivery. ${data.returnPolicy.refund_procedure}`
                : "Return requests will open once the store's return policy is published."}
            </p>
            {data.returns.length ? (
              data.returns.map((r) => (
                <article key={r.id} className={styles.row}>
                  <div>
                    <h2>Return #{r.return_number}</h2>
                    <p className={styles.status}>{r.status.replaceAll("_", " ")}</p>
                    <p>{r.reason_code.replaceAll("_", " ")}</p>
                    <time dateTime={r.requested_at}>
                      {new Date(r.requested_at).toLocaleDateString("en-PK", {
                        timeZone: "Asia/Karachi",
                      })}
                    </time>
                  </div>
                  <Link href={`/account/orders/${r.order_id}` as Route}>View original order</Link>
                </article>
              ))
            ) : (
              <p className={styles.empty}>No return requests.</p>
            )}
          </>
        ) : null}
        {section === "settings" ? (
          <>
            <section className={styles.section}>
              <h2>Notifications</h2>
              <Link href="/account/notifications/preferences">Manage notification settings</Link>
            </section>
            <section className={styles.section}>
              <h2>Change password</h2>
              <AuthForm mode="password" emailReady={process.env.AUTH_EMAIL_READY === "true"} />
            </section>
            <section className={styles.section}>
              <h2>Change email address</h2>
              <AuthForm mode="email" emailReady={process.env.AUTH_EMAIL_READY === "true"} />
            </section>
          </>
        ) : null}
        {page > 1 && ["orders", "returns"].includes(section) ? (
          <Link href={`/account/${section}?page=${page - 1}` as Route}>Previous page</Link>
        ) : null}
        {section === "returns" && data.returns.length === 20 ? (
          <Link href={`/account/returns?page=${page + 1}` as Route}>Next returns</Link>
        ) : null}
        <section className={styles.section}>
          <SignOutButton />
        </section>
      </AccountSessionGuard>
    </main>
  );
}
