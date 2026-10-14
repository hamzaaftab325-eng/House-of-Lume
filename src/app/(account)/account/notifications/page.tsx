import { NotificationPage } from "@/components/notifications/notification-page";
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <NotificationPage audience="customer" searchParams={searchParams} />;
}
