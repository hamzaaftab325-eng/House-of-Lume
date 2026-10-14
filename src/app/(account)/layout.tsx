import type { Metadata } from "next";
import StoreLayout from "@/app/(store)/layout";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AccountGroupLayout({ children }: { children: React.ReactNode }) {
  return <StoreLayout>{children}</StoreLayout>;
}
