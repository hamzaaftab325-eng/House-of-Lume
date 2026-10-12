import type { Metadata } from "next";

import { HomeCategories } from "@/components/home/home-categories";
import { HomeEditorialSections } from "@/components/home/home-editorial-sections";
import { HomeHero } from "@/components/home/home-hero";
import { HomeProducts } from "@/components/home/home-products";

export const metadata: Metadata = {
  title: "House of Lume — Refined Living for Modern Homes",
  description:
    "Considered lighting, greenery, and objects for calmer, more beautiful homes across Pakistan.",
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
