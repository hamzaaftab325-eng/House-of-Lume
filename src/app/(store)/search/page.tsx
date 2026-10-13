import type { Metadata } from "next";

import { CatalogueView } from "@/components/catalogue/catalogue-view";
import { getCataloguePageData, getSearchSuggestions } from "@/server/catalogue/service";
import { parseCatalogueQuery, type RawSearchParams } from "@/server/catalogue/validation";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search House of Lume products, categories, curated collections, and editorial stories.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const query = parseCatalogueQuery(await searchParams);
  const dataPromise = getCataloguePageData(query);
  const discoveryPromise = query.q
    ? getSearchSuggestions(query.q)
    : Promise.resolve({ products: [], categories: [], collections: [], editorial: [] });
  const [data, discovery] = await Promise.all([dataPromise, discoveryPromise]);

  return (
    <CatalogueView
      basePath="/search"
      eyebrow="Search the house"
      title={query.q ? `“${query.q}”` : "Find the object you have in mind."}
      description={
        query.q
          ? "Search across the live catalogue and continue through related categories, collections, and editorial stories."
          : "Use the search field in the header to look by object, room, material, finish, category, collection, or story."
      }
      query={query}
      data={data}
      discovery={
        query.q
          ? {
              query: query.q,
              categories: discovery.categories,
              collections: discovery.collections,
              editorial: discovery.editorial,
            }
          : undefined
      }
    />
  );
}
