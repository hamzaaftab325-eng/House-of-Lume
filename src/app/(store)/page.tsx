import type { Metadata } from "next";

import { HomeCategories } from "@/components/home/home-categories";
import { HomeEditorialSections } from "@/components/home/home-editorial-sections";
import { HomeHero } from "@/components/home/home-hero";
import { HomeProducts } from "@/components/home/home-products";

const title = "DWELLUNE — Refined Living for Modern Homes";

export const metadata: Metadata = {
  title: { absolute: title },
  description:
    "Considered lighting, greenery, and objects for calmer, more beautiful homes across Pakistan.",
  alternates: { canonical: "/" },
  openGraph: { title, siteName: "DWELLUNE", url: "/", type: "website" },
};

export default function StorefrontHomePage() {
  return (
    <main>
      <HomeHero />
      <HomeCategories />
      <HomeProducts />
      <HomeEditorialSections />
    </main>
  );
}
