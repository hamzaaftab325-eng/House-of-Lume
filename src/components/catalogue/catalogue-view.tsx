import Image from "next/image";

import type {
  CatalogueCategory,
  CatalogueCollection,
  CataloguePageData,
  CatalogueProduct,
  CatalogueQuery,
  SearchSuggestionEditorial,
} from "@/server/catalogue/types";

import { CatalogueControls } from "./catalogue-controls";
import styles from "./catalogue.module.css";

const priceFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

type CatalogueDiscoveryResults = {
  query: string;
  categories: CatalogueCategory[];
  collections: CatalogueCollection[];
  editorial: SearchSuggestionEditorial[];
};

type CatalogueViewProps = {
  basePath: string;
  eyebrow: string;
  title: string;
  description: string;
  query: CatalogueQuery;
  data: CataloguePageData;
  showCategoryFilter?: boolean;
  discovery?: CatalogueDiscoveryResults;
};

function formatPrice(product: CatalogueProduct) {
  if (product.minPricePkr === null) return "Price coming soon";
  if (product.maxPricePkr === null || product.maxPricePkr === product.minPricePkr) {
    return priceFormatter.format(product.minPricePkr);
  }
  return `${priceFormatter.format(product.minPricePkr)} – ${priceFormatter.format(product.maxPricePkr)}`;
}

function canRenderRemoteMedia(path: string | null) {
  if (!path) return false;
  try {
    const url = new URL(path);
    return (
      url.protocol === "https:" &&
      (url.hostname === "res.cloudinary.com" || url.hostname.endsWith(".supabase.co"))
    );
  } catch {
    return false;
  }
}

function ProductFallbackArt({ productType }: { productType: string }) {
  return (
    <div className={styles.fallbackArt} data-product-type={productType} aria-hidden="true">
      <span className={styles.fallbackGlow} />
      <span className={styles.fallbackObjectA} />
      <span className={styles.fallbackObjectB} />
      <span className={styles.fallbackGround} />
    </div>
  );
}

function ProductUnit({ product, index }: { product: CatalogueProduct; index: number }) {
  const hasMedia = canRenderRemoteMedia(product.primaryMediaPath);

  return (
    <article className={styles.productUnit} data-testid="catalogue-product">
      <div className={styles.productStage}>
        <div className={styles.productStageRail}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span>{product.primaryCategorySlug?.replaceAll("-", " ") ?? product.productType}</span>
        </div>
        <div className={styles.productMedia}>
          {hasMedia && product.primaryMediaPath ? (
            <Image
              src={product.primaryMediaPath}
              alt={product.primaryMediaAlt ?? product.name}
              fill
              sizes="(max-width: 42rem) 90vw, (max-width: 72rem) 46vw, 31vw"
              className={styles.productImage}
            />
          ) : (
            <ProductFallbackArt productType={product.productType} />
          )}
        </div>
        <div className={styles.stageStatus} data-stock={product.inStock ? "in" : "out"}>
          <span aria-hidden="true" />
          {product.inStock ? "In stock" : "Currently unavailable"}
        </div>
      </div>

      <div className={styles.productMeta}>
        <div>
          <p className={styles.productType}>{product.productType.replaceAll("_", " ")}</p>
          <h2 className={styles.productName}>{product.name}</h2>
          <p className={styles.productContext}>
            {product.materialSummary ??
              product.shortDescription ??
              "A considered House of Lume object."}
          </p>
        </div>
        <p className={styles.productPrice}>{formatPrice(product)}</p>
      </div>
    </article>
  );
}

function buildPageHref(basePath: string, query: CatalogueQuery, page: number) {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.availability) params.set("availability", query.availability);
  if (query.minPrice !== undefined) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("maxPrice", String(query.maxPrice));
  if (query.material) params.set("material", query.material);
  if (query.color) params.set("color", query.color);
  if (query.sort !== "featured") params.set("sort", query.sort);
  if (query.q) params.set("q", query.q);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}

function DiscoveryResults({ discovery }: { discovery: CatalogueDiscoveryResults }) {
  if (
    discovery.categories.length === 0 &&
    discovery.collections.length === 0 &&
    discovery.editorial.length === 0
  ) {
    return null;
  }

  return (
    <section className={styles.discovery} aria-labelledby="discovery-title">
      <div className={styles.discoveryHeading}>
        <p>Related paths</p>
        <h2 id="discovery-title">Continue through the house</h2>
      </div>
      <div className={styles.discoveryGroups}>
        {discovery.categories.length > 0 ? (
          <div className={styles.discoveryGroup}>
            <h3>Categories</h3>
            {discovery.categories.map((category) => (
              <a key={category.id} href={`/categories/${category.slug}`}>
                <span>{category.name}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        ) : null}
        {discovery.collections.length > 0 ? (
          <div className={styles.discoveryGroup}>
            <h3>Collections</h3>
            {discovery.collections.map((collection) => (
              <a key={collection.id} href={`/collections/${collection.slug}`}>
                <span>{collection.name}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        ) : null}
        {discovery.editorial.length > 0 ? (
          <div className={styles.discoveryGroup}>
            <h3>Editorial</h3>
            {discovery.editorial.map((item) => (
              <a key={item.id} href={item.href}>
                <span>{item.name}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function CatalogueView({
  basePath,
  eyebrow,
  title,
  description,
  query,
  data,
  showCategoryFilter = true,
  discovery,
}: CatalogueViewProps) {
  const { result, facets, categories } = data;
  const isSearch = Boolean(query.q);
  const hasFilters = Boolean(
    query.q ||
      query.category ||
      query.availability ||
      query.minPrice !== undefined ||
      query.maxPrice !== undefined ||
      query.material ||
      query.color,
  );

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroIndex} aria-hidden="true">
            <span>House</span>
            <span>04</span>
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1>{title}</h1>
            <p className={styles.description}>{description}</p>
          </div>
          <div className={styles.heroCount} aria-live="polite">
            <strong>{result.totalCount}</strong>
            <span>{result.totalCount === 1 ? "object" : "objects"}</span>
          </div>
        </div>
      </header>

      {discovery ? <DiscoveryResults discovery={discovery} /> : null}

      <div className={styles.catalogueShell}>
        <CatalogueControls
          basePath={basePath}
          query={query}
          facets={facets}
          categories={categories}
          resultCount={result.totalCount}
          showCategoryFilter={showCategoryFilter}
        />

        <section className={styles.results} aria-labelledby="catalogue-results-title">
          <div className={styles.resultsHeader}>
            <div>
              <p>Collection view</p>
              <h2 id="catalogue-results-title">
                {query.q ? `Results for “${query.q}”` : "Objects in view"}
              </h2>
            </div>
            <span>
              {result.totalCount === 0
                ? "No objects"
                : `${(result.page - 1) * result.pageSize + 1}–${Math.min(
                    result.page * result.pageSize,
                    result.totalCount,
                  )} of ${result.totalCount}`}
            </span>
          </div>

          {result.products.length > 0 ? (
            <div className={styles.productGrid} role="list" aria-label="Catalogue products">
              {result.products.map((product, index) => (
                <div key={product.id} role="listitem">
                  <ProductUnit
                    product={product}
                    index={(result.page - 1) * result.pageSize + index}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState} data-testid="catalogue-empty-state">
              <p className={styles.emptyEyebrow}>
                {isSearch ? "Search the house" : hasFilters ? "Refine the edit" : "A quiet shelf"}
              </p>
              <h2>
                {isSearch
                  ? `No direct match for “${query.q}”.`
                  : hasFilters
                    ? "Nothing meets this combination yet."
                    : "The catalogue is ready for its first published objects."}
              </h2>
              <p>
                {isSearch
                  ? "Try a broader object, room, material, category, collection, or editorial idea."
                  : hasFilters
                    ? "Clear one or more filters to widen the selection."
                    : "House of Lume is keeping unpublished inventory private until real products, pricing, and stock are ready for customers."}
              </p>
              <div className={styles.emptyActions}>
                {hasFilters ? <a href={basePath}>Clear filters</a> : <a href="/">Return home</a>}
                <a href="/collections/new-arrivals">View New Arrivals</a>
              </div>
            </div>
          )}

          {result.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Catalogue pages">
              {result.page > 1 ? (
                <a href={buildPageHref(basePath, query, result.page - 1)}>← Previous</a>
              ) : (
                <span aria-disabled="true">← Previous</span>
              )}
              <p>
                Page <strong>{result.page}</strong> of {result.totalPages}
              </p>
              {result.page < result.totalPages ? (
                <a href={buildPageHref(basePath, query, result.page + 1)}>Next →</a>
              ) : (
                <span aria-disabled="true">Next →</span>
              )}
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  );
}
