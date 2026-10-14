import type { Route } from "next";
import { DwelluneButtonLink } from "@/components/ui/controls";
import styles from "@/components/account/account.module.css";
export default function CrmPage() {
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>DWELLUNE · SUPER ADMIN</p>
      <h1 className={styles.title}>Administrator workspace.</h1>
      <p className={styles.intro}>
        Review Cash on Delivery orders, record customer contact and approve or cancel verification
        requests.
      </p>
      <div className={styles.actions}>
        <DwelluneButtonLink href="/crm/verification">Open verification queue</DwelluneButtonLink>
        <DwelluneButtonLink href={"/crm/notifications" as Route} variant="frame">
          Notifications
        </DwelluneButtonLink>
      </div>
      <p className={styles.intro}>
        Checkout remains closed until real products and launch acceptance are ready. Product
        management and the complete fulfillment CRM belong to later operations work.
      </p>
    </main>
  );
}
