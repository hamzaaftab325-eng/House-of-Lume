import type { Metadata } from "next";
import { CommercePage } from "@/components/store/commerce-view";
export const metadata: Metadata = {
  title: "Saved objects",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <CommercePage wishlist />;
}
