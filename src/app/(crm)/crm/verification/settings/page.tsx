import Link from "next/link";
import { redirect } from "next/navigation";
import { verificationPolicy } from "@/server/admin/verification-policy.service";
import { VerificationPolicyForm } from "@/components/admin/verification-policy-form";
import styles from "@/components/account/account.module.css";
export default async function VerificationSettings() {
  let policy;
  try {
    policy = await verificationPolicy();
  } catch (error) {
    if (error instanceof Error && error.message === "authentication_required")
      redirect("/auth/signin?next=%2Fcrm%2Fverification%2Fsettings");
    throw error;
  }
  return (
    <main className={styles.page}>
      <Link href="/crm/verification">Back to verification queue</Link>
      <h1 className={styles.title}>COD verification rules.</h1>
      <p className={styles.intro}>
        Set verification and manual-review thresholds for new orders. Existing recorded flags stay
        in their order history. Order limits apply across phone, account and guest-cart identity.
        Matching retries return the existing order.
      </p>
      <p className={styles.intro}>
        Flagged orders require a recorded staff review before confirmation. Saving these rules does
        not open checkout.
      </p>
      <VerificationPolicyForm key={policy.revision} policy={policy} />
    </main>
  );
}
