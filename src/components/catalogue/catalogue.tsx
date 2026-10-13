import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PackageOpen } from "lucide-react";

import { catalogueHref, type CatalogueFilters } from "@/lib/catalogue";
import {
  cataloguePageSize,
  type CatalogueCategory,
  type CatalogueFacets,
  type CatalogueProduct,
} from "@/server/catalogue/catalogue.service";

import { CatalogueControls } from "./catalogue-controls";
import styles from "./catalogue.module.css";

const money = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

function productPrice(product: CatalogueProduct) {
  if (product.min_price_pkr === null) return "Price on request";
  if (product.max_price_pkr && product.max_price_pkr !== product.min_price_pkr) {
    return `${money.format(product.min_price_pkr)} – ${money.format(product.max_price_pkr)}`;
  }
  return money.format(product.min_price_pkr);
}

function cloudinaryImage(path: string | null) {
  return path?.startsWith("https://res.cloudinary.com/diometfe9/") ? path : null;
}

export function ProductUnit({ product }: { product: CatalogueProduct }) {
  const image = cloudinaryImage(product.primary_media_path);
  const material = product.materials[0] ?? product.material_summary ?? product.product_type;

  return (
    <article className={styles.productUnit} data-testid="catalogue-product">
      <div className={styles.productStage}>
        {image ? (
          <Image
            alt={product.primary_media_alt ?? product.name}
            className={styles.productImage}
            fill
            sizes="(max-width: 45rem) 46vw, (max-width: 75rem) 31vw, 23vw"
            src={image}
          />
        ) : (
          <div className={styles.productPlaceholder} aria-hidden="true">
            <span>House of Lume</span>
            <PackageOpen />
          </div>
        )}
        <span className={styles.stockState} data-stock={product.in_stock ? "in" : "out"}>
          {product.in_stock ? "In stock" : "Currently unavailable"}
        </span>
      </div>

      <div className={styles.productMeta}>
        <div className={styles.productRail} aria-hidden="true" />
        <p className={styles.productContext}>{material}</p>
        <h2>{product.name}</h2>
        {product.short_description ? (
          <p className={styles.productDescription}>{product.short_description}</p>
        ) : null}
        <div className={styles.productFooter}>
          <strong>{productPrice(product)}</strong>
          <span className={styles.serviceNote}>Cash on Delivery</span>
        </div>
      </div>
    </article>
  );
}

export type CatalogueViewProps = {
  eyebrow: string;
  title: string;
  description: string;
  basePath: string;
  filters: CatalogueFilters;
  products: CatalogueProduct[];
  totalCount: number;
  facets: CatalogueFacets;
  categories: CatalogueCategory[];
  emptyTitle?: string;
};

export function CatalogueView({
  eyebrow,
  title,
  description,
  basePath,
  filters,
  products,
  totalCount,
  facets,
  categories,
  emptyTitle = "The shelf is quiet right now.",
}: CatalogueViewProps) {
  const pageCount = Math.max(1, Math.ceil(totalCount / cataloguePageSize));
  const page = Math.min(filters.page, pageCount);

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="catalogue-title">
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 id="catalogue-title">{title}</h1>
          <p className={styles.lede}>{description}</p>
          <div className={styles.heroLine} aria-hidden="true" />
        </div>
      </section>

      <section className={styles.catalogue} aria-label={`${title} catalogue`}>
        <CatalogueControls
          basePath={basePath}
          categories={categories}
          facets={facets}
          filters={filters}
          totalCount={totalCount}
        />

        <div className={styles.results} aria-live="polite">
          {products.length ? (
            <div className={styles.grid} role="list" aria-label={`${totalCount} catalogue objects`}>
              {products.map((product) => (
                <div key={product.id} role="listitem">
                  <ProductUnit product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty} data-testid="catalogue-empty">
              <p className={styles.emptyEyebrow}>House of Lume catalogue</p>
              <h2>{emptyTitle}</h2>
              <p>
                {filters.q ||
                filters.category ||
                filters.availability ||
                filters.material ||
                filters.color
                  ? "Try clearing a filter or exploring another room, material, or collection."
                  : "Our online shelves are being prepared. Explore the House while the first objects arrive."}
              </p>
              <Link className={styles.emptyLink} href="/shop">
                Explore the full catalogue <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        {pageCount > 1 ? (
          <nav className={styles.pagination} aria-label="Catalogue pages">
            {page > 1 ? (
              <Link href={catalogueHref(basePath, filters, { page: page - 1 }) as Route}>
                Previous
              </Link>
            ) : (
              <span aria-disabled="true">Previous</span>
            )}
            <span>
              Page {page} of {pageCount}
            </span>
            {page < pageCount ? (
              <Link href={catalogueHref(basePath, filters, { page: page + 1 }) as Route}>
                Next
              </Link>
            ) : (
              <span aria-disabled="true">Next</span>
            )}
          </nav>
        ) : null}
      </section>
    </main>
  );
}
