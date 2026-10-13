import type { Metadata } from "next";

import { CatalogueView } from "@/components/catalogue/catalogue";
import { parseCatalogueFilters, type SearchParamsInput } from "@/lib/catalogue";
import { getCatalogue } from "@/server/catalogue/catalogue.service";

export const metadata: Metadata = {
  title: "Shop the House | DWELLUNE",
  description:
    "Explore DWELLUNE lighting, greenery, planters, décor, candles, mirrors, and considered objects for modern homes.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const filters = parseCatalogueFilters(await searchParams);
  const catalogue = await getCatalogue(filters);

  return (
    <CatalogueView
      eyebrow="The House"
      title="Objects for considered living."
      description="Browse light, greenery, materials, and finishing pieces selected to bring warmth and character into everyday rooms."
      basePath="/shop"
      filters={filters}
      {...catalogue}
    />
  );
}
