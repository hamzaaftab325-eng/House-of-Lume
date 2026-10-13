"use client";

import type { Route } from "next";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { Drawer } from "@/components/ui/overlays";
import { activeFilterCount, catalogueQueryString, type CatalogueFilters } from "@/lib/catalogue";
import type { CatalogueCategory, CatalogueFacets } from "@/server/catalogue/catalogue.service";

import styles from "./catalogue.module.css";

type Props = {
  basePath: string;
  filters: CatalogueFilters;
  facets: CatalogueFacets;
  categories: CatalogueCategory[];
  totalCount: number;
};

const sortOptions = [
  ["featured", "Featured"],
  ["newest", "Newest"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["name-asc", "Name: A–Z"],
] as const;

function HiddenState({ filters, omit }: { filters: CatalogueFilters; omit: string[] }) {
  const query = catalogueQueryString({ ...filters, page: 1 });
  const entries = Array.from(new URLSearchParams(query).entries()).filter(
    ([key]) => !omit.includes(key),
  );
  return (
    <>
      {entries.map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
    </>
  );
}

function FilterForm({
  basePath,
  filters,
  facets,
  categories,
  onSubmit,
}: Props & { onSubmit?: () => void }) {
  return (
    <form className={styles.filterForm} action={basePath} method="get" onSubmit={onSubmit}>
      {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
      {filters.collection ? (
        <input type="hidden" name="collection" value={filters.collection} />
      ) : null}
      {filters.sort !== "featured" ? (
        <input type="hidden" name="sort" value={filters.sort} />
      ) : null}

      <fieldset>
        <legend>Category</legend>
        <select aria-label="Category" name="category" defaultValue={filters.category ?? ""}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset>
        <legend>Availability</legend>
        <select
          aria-label="Availability"
          name="availability"
          defaultValue={filters.availability ?? ""}
        >
          <option value="">All availability</option>
          <option value="in-stock">In stock</option>
          <option value="out-of-stock">Out of stock</option>
        </select>
      </fieldset>

      <fieldset>
        <legend>Price · PKR</legend>
        <div className={styles.priceFields}>
          <label>
            <span>Minimum</span>
            <input
              name="minPrice"
              inputMode="numeric"
              type="number"
              min="0"
              defaultValue={filters.minPrice}
            />
          </label>
          <label>
            <span>Maximum</span>
            <input
              name="maxPrice"
              inputMode="numeric"
              type="number"
              min="0"
              defaultValue={filters.maxPrice}
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Material</legend>
        <select aria-label="Material" name="material" defaultValue={filters.material ?? ""}>
          <option value="">All materials</option>
          {facets.materials.map((material) => (
            <option key={material} value={material}>
              {material}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset>
        <legend>Color / finish</legend>
        <select aria-label="Color or finish" name="color" defaultValue={filters.color ?? ""}>
          <option value="">All colors</option>
          {facets.colors.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </fieldset>

      <div className={styles.filterActions}>
        <button type="submit">Apply filters</button>
        <Link href={basePath as Route}>Clear</Link>
      </div>
    </form>
  );
}

export function CatalogueControls(props: Props) {
  const { basePath, filters, totalCount } = props;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const count = activeFilterCount(filters);

  return (
    <div className={styles.controls}>
      <aside className={styles.desktopFilters} aria-label="Catalogue filters">
        <div className={styles.filterHeading}>
          <span>Refine</span>
          {count ? <strong>{count}</strong> : null}
        </div>
        <FilterForm {...props} />
      </aside>

      <div className={styles.resultsColumn}>
        <div className={styles.toolbar}>
          <p>
            <strong>{totalCount}</strong> {totalCount === 1 ? "object" : "objects"}
          </p>
          <div className={styles.toolbarActions}>
            <button
              className={styles.mobileFilterButton}
              type="button"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal aria-hidden="true" />
              Filters{count ? ` (${count})` : ""}
            </button>
            <form action={basePath} method="get" className={styles.sortForm}>
              <HiddenState filters={filters} omit={["sort", "page"]} />
              <label htmlFor="catalogue-sort">Sort</label>
              <select
                id="catalogue-sort"
                name="sort"
                defaultValue={filters.sort}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
              >
                {sortOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </form>
          </div>
        </div>

        {count ? (
          <div className={styles.activeFilters} aria-label="Active filters">
            <span>
              {count} active {count === 1 ? "filter" : "filters"}
            </span>
            <Link href={basePath as Route}>
              <X aria-hidden="true" /> Clear all
            </Link>
          </div>
        ) : null}
      </div>

      <Drawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        eyebrow="Catalogue"
        title="Refine the shelf"
        description={`${totalCount} ${totalCount === 1 ? "object" : "objects"} in this view.`}
      >
        <FilterForm {...props} onSubmit={() => setFiltersOpen(false)} />
      </Drawer>
    </div>
  );
}
