import { notFound } from "next/navigation";
import { AccountPage, sections, type AccountSection } from "@/components/account/account-page";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { section } = await params;
  if (section === "notifications" || !Object.hasOwn(sections, section)) notFound();
  return <AccountPage section={section as AccountSection} page={(await searchParams).page} />;
}
