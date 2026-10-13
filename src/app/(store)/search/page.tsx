import type { Metadata, Route } from "next";
import Link from "next/link";

import { CatalogueView } from "@/components/catalogue/catalogue";
import { parseCatalogueFilters, type SearchParamsInput } from "@/lib/catalogue";
import { getCatalogue, getSearchSuggestions } from "@/server/catalogue/catalogue.service";

import styles from "./search-page.module.css";

export const metadata: Metadata = {
  title: "Search | House of Lume",
  description: "Search the House of Lume catalogue, categories, and curated collections.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const filters = parseCatalogueFilters(await searchParams);
  const [catalogue, suggestions] = await Promise.all([
    getCatalogue(filters),
    filters.q
      ? getSearchSuggestions(filters.q)
      : Promise.resolve({ products: [], categories: [], collections: [] }),
  ]);

  const related = [
    ...suggestions.categories.map((item) => ({
      label: item.name,
      meta: "Category",
      href: `/categories/${item.slug}` as Route,
    })),
    ...suggestions.collections.map((item) => ({
      label: item.name,
      meta: "Collection",
      href: `/collections/${item.slug}` as Route,
    })),
  ];

  return (
    <>
      <CatalogueView
        eyebrow="Search the House"
        title={filters.q ? `Results for “${filters.q}”` : "Find your next object."}
        description={
          filters.q
            ? `${catalogue.totalCount} ${catalogue.totalCount === 1 ? "object matches" : "objects match"} your search.`
            : "Search by object, mood, material, category, or collection."
        }
        basePath="/search"
        filters={filters}
        emptyTitle={filters.q ? `No objects found for “${filters.q}”.` : "Start with a search."}
        {...catalogue}
      />

      {related.length ? (
        <aside className={styles.related} aria-labelledby="related-search-title">
          <div>
            <p>Explore beyond products</p>
            <h2 id="related-search-title">Related destinations</h2>
          </div>
          <nav aria-label="Related search destinations">
            {related.map((item) => (
              <Link key={`${item.meta}-${item.href}`} href={item.href}>
                <span>{item.label}</span>
                <small>{item.meta}</small>
              </Link>
            ))}
          </nav>
        </aside>
      ) : null}
    </>
  );
}
