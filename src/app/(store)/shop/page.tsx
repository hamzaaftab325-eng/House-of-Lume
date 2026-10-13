import type { Metadata } from "next";

import { CatalogueView } from "@/components/catalogue/catalogue-view";
import { getCataloguePageData } from "@/server/catalogue/service";
import { parseCatalogueQuery, type RawSearchParams } from "@/server/catalogue/validation";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse House of Lume lighting, plants, planters, décor, candles, mirrors, and considered objects for the home.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const query = parseCatalogueQuery(await searchParams);
  const data = await getCataloguePageData(query);

  return (
    <CatalogueView
      basePath="/shop"
      eyebrow="The House Edit"
      title="Objects for warmer living."
      description="A quiet catalogue of light, greenery, material, and finishing objects — composed for homes that feel considered rather than filled."
      query={query}
      data={data}
    />
  );
}
