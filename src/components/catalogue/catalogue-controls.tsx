"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { Drawer } from "@/components/ui/overlays";
import type { CatalogueCategory, CatalogueFacets, CatalogueQuery } from "@/server/catalogue/types";

import styles from "./catalogue.module.css";

type CatalogueControlsProps = {
  basePath: string;
  query: CatalogueQuery;
  facets: CatalogueFacets;
  categories: CatalogueCategory[];
  resultCount: number;
  showCategoryFilter: boolean;
};

function HiddenQueryState({ query, omit }: { query: CatalogueQuery; omit: string[] }) {
  const values: Array<[string, string | number | undefined]> = [
    ["category", query.category],
    ["availability", query.availability],
    ["minPrice", query.minPrice],
    ["maxPrice", query.maxPrice],
    ["material", query.material],
    ["color", query.color],
    ["sort", query.sort !== "featured" ? query.sort : undefined],
    ["q", query.q],
  ];

  return values
    .filter(([name, value]) => value !== undefined && !omit.includes(name))
    .map(([name, value]) => <input key={name} type="hidden" name={name} value={String(value)} />);
}

function FilterFields({
  query,
  facets,
  categories,
  showCategoryFilter,
}: Omit<CatalogueControlsProps, "basePath" | "resultCount">) {
  return (
    <div className={styles.filterFields}>
      {showCategoryFilter ? (
        <fieldset className={styles.filterGroup}>
          <legend>Category</legend>
          <select aria-label="Category" name="category" defaultValue={query.category ?? ""}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </fieldset>
      ) : null}

      <fieldset className={styles.filterGroup}>
        <legend>Availability</legend>
        <label className={styles.radioRow}>
          <input type="radio" name="availability" value="" defaultChecked={!query.availability} />
          <span>All availability</span>
        </label>
        <label className={styles.radioRow}>
          <input
            type="radio"
            name="availability"
            value="in-stock"
            defaultChecked={query.availability === "in-stock"}
          />
          <span>In stock</span>
        </label>
        <label className={styles.radioRow}>
          <input
            type="radio"
            name="availability"
            value="out-of-stock"
            defaultChecked={query.availability === "out-of-stock"}
          />
          <span>Currently unavailable</span>
        </label>
      </fieldset>

      <fieldset className={styles.filterGroup}>
        <legend>Price · PKR</legend>
        <div className={styles.priceRange}>
          <label>
            <span>From</span>
            <input
              inputMode="numeric"
              min="0"
              name="minPrice"
              type="number"
              defaultValue={query.minPrice}
              placeholder={facets.minPricePkr !== null ? String(facets.minPricePkr) : "0"}
            />
          </label>
          <label>
            <span>To</span>
            <input
              inputMode="numeric"
              min="0"
              name="maxPrice"
              type="number"
              defaultValue={query.maxPrice}
              placeholder={facets.maxPricePkr !== null ? String(facets.maxPricePkr) : "Any"}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.filterGroup}>
        <legend>Material</legend>
        <select aria-label="Material" name="material" defaultValue={query.material ?? ""}>
          <option value="">All materials</option>
          {facets.materials.map((material) => (
            <option key={material} value={material}>
              {material}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className={styles.filterGroup}>
        <legend>Color / finish</legend>
        <select aria-label="Color / finish" name="color" defaultValue={query.color ?? ""}>
          <option value="">All colors</option>
          {facets.colors.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </fieldset>
    </div>
  );
}

function FilterForm(props: CatalogueControlsProps & { onApplied?: () => void }) {
  const { basePath, query, facets, categories, resultCount, showCategoryFilter, onApplied } = props;
  return (
    <form className={styles.filterForm} action={basePath} method="get" onSubmit={onApplied}>
      <HiddenQueryState
        query={query}
        omit={["category", "availability", "minPrice", "maxPrice", "material", "color", "page"]}
      />
      <FilterFields
        query={query}
        facets={facets}
        categories={categories}
        showCategoryFilter={showCategoryFilter}
      />
      <div className={styles.filterActions}>
        <button type="submit">Apply filters</button>
        <a href={query.q ? `${basePath}?q=${encodeURIComponent(query.q)}` : basePath}>Clear</a>
      </div>
    </form>
  );
}

export function CatalogueControls(props: CatalogueControlsProps) {
  const { basePath, query, resultCount } = props;
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilters = useMemo(
    () =>
      [
        query.category,
        query.availability,
        query.minPrice !== undefined || query.maxPrice !== undefined ? "price" : undefined,
        query.material,
        query.color,
      ].filter(Boolean).length,
    [query],
  );

  return (
    <aside className={styles.controls} aria-label="Catalogue controls">
      <div className={styles.mobileToolbar}>
        <button
          type="button"
          className={styles.mobileFilterButton}
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal size={17} aria-hidden="true" />
          Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}
        </button>
        <span>{resultCount} objects</span>
      </div>

      <div className={styles.desktopFilters}>
        <div className={styles.controlsHeading}>
          <p>Refine</p>
          <span>{activeFilters > 0 ? `${activeFilters} active` : "All objects"}</span>
        </div>
        <FilterForm {...props} />
      </div>

      <form className={styles.sortForm} action={basePath} method="get">
        <HiddenQueryState query={query} omit={["sort", "page"]} />
        <label htmlFor="catalogue-sort">Sort</label>
        <select
          id="catalogue-sort"
          name="sort"
          defaultValue={query.sort}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price · low to high</option>
          <option value="price-desc">Price · high to low</option>
          <option value="name-asc">Name · A to Z</option>
        </select>
      </form>

      <Drawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        side="left"
        eyebrow="Catalogue"
        title="Refine the edit"
        description={`${resultCount} ${resultCount === 1 ? "object" : "objects"} currently in view.`}
      >
        <FilterForm {...props} onApplied={() => setFiltersOpen(false)} />
      </Drawer>
    </aside>
  );
}
