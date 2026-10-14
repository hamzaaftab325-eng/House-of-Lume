import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/checkout-page";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Checkout review",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <CheckoutPage />;
}
