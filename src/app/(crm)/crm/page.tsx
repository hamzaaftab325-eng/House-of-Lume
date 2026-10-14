import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { adminIdentity } from "@/server/admin/admin.service";
import { AccountSessionGuard } from "@/components/account/session-guard";
import { SignOutButton } from "@/components/account/account-forms";
import { DwelluneButtonLink } from "@/components/ui/controls";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administrator workspace",
  robots: { index: false, follow: false },
};
export default async function CrmPage() {
  let admin;
  try {
    admin = await adminIdentity();
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "authentication_required") redirect("/auth/signin?next=%2Fcrm");
    if (code === "staff_access_required") {
      return (
        <main className="foundation-page">
          <div className="site-shell reading-width">
            <h1 className="foundation-title">Staff access required.</h1>
            <p>Your account does not have administrator access.</p>
            <DwelluneButtonLink href="/account">Open your account</DwelluneButtonLink>
          </div>
        </main>
      );
    }
    throw e;
  }
  return (
    <AccountSessionGuard customerId={admin.customerId}>
      <main className="foundation-page">
        <div className="site-shell reading-width">
          <p className="foundation-kicker">DWELLUNE · SUPER ADMIN</p>
          <h1 className="foundation-title">Administrator workspace.</h1>
          <p className="foundation-copy">
            Signed in as {admin.email}. Your administrator role is verified on the server. This
            account has the store’s Super Admin database permissions.
          </p>
          <p className="foundation-copy">
            Order placement remains closed while transactional email and real inventory are
            configured. The complete order-management CRM belongs to the later operations phase.
          </p>
          <div className="foundation-links">
            <DwelluneButtonLink href="/account">Profile and password</DwelluneButtonLink>
            <DwelluneButtonLink href={"/account/notifications" as Route} variant="frame">
              Notifications
            </DwelluneButtonLink>
            <SignOutButton />
          </div>
        </div>
      </main>
    </AccountSessionGuard>
  );
}
