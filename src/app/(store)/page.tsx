import type { Metadata } from "next";

import { HomeCategories } from "@/components/home/home-categories";
import { HomeHero } from "@/components/home/home-hero";

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
    </main>
  );
}
