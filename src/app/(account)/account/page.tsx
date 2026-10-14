import { AccountPage } from "@/components/account/account-page";
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return <AccountPage section="profile" page={(await searchParams).page} />;
}
