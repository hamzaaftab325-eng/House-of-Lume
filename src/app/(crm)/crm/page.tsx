import type { Route } from "next";
import Link from "next/link";
import { DwelluneButtonLink } from "@/components/ui/controls";
import styles from "@/components/admin/verification.module.css";

const workspaces: Array<{ href: Route; title: string; copy: string }> = [
  { href: "/crm/verification", title: "COD verification", copy: "Review pending Cash on Delivery requests and record customer contact." },
  { href: "/crm/verification/settings", title: "Verification rules", copy: "Review the policy and decision rules used by the verification workflow." },
  { href: "/crm/notifications", title: "Notifications", copy: "Open the operational inbox and review unread owner notifications." },
  { href: "/crm/notifications/delivery", title: "Delivery status", copy: "Inspect bounded email delivery status and the supported event registry." },
];

export default function CrmPage() {
  return (
    <main className={styles.workspace}>
      <section className={styles.workspaceHero} aria-labelledby="workspace-title">
        <p className={styles.eyebrow}>DWELLUNE · OWNER OPERATIONS</p>
        <h1 id="workspace-title">Administrator workspace</h1>
        <p>One focused place for the operational tools that are live today. Future catalogue, fulfillment, customer and analytics modules stay out until their workflows are implemented and verified.</p>
        <div className={styles.workspaceActions}>
          <DwelluneButtonLink href="/crm/verification">Open verification queue</DwelluneButtonLink>
          <DwelluneButtonLink href={"/crm/notifications" as Route} variant="frame">Open notifications</DwelluneButtonLink>
        </div>
      </section>

      <section aria-labelledby="operations-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>LIVE OPERATIONS</p>
          <h2 id="operations-title">Working destinations</h2>
        </div>
        <div className={styles.workspaceGrid}>
          {workspaces.map((item, index) => (
            <Link className={styles.workspaceCard} href={item.href} key={item.href}>
              <span className={styles.cardIndex}>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <span className={styles.cardAction}>Open workspace →</span>
            </Link>
          ))}
        </div>
      </section>

      <aside className={styles.readiness} aria-label="Launch readiness">
        <div><span className={styles.statusDot} aria-hidden="true" /><strong>Owner operations available</strong></div>
        <p>Checkout remains closed until real products and launch acceptance are ready. No sales or order analytics are shown here because verified production data for those future modules is not yet part of this workspace.</p>
      </aside>
    </main>
  );
}
