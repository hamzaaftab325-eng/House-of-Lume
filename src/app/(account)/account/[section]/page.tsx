import { notificationFilter } from "@/lib/account";
import { notFound } from "next/navigation";
import { AccountPage, sections } from "@/components/account/account-page";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const { section } = await params;
  if (!Object.hasOwn(sections, section)) notFound();
  return (
    <AccountPage
      section={section as keyof typeof sections}
      page={(await searchParams).page}
      filter={notificationFilter((await searchParams).filter)}
    />
  );
}
