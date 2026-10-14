import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PackageOpen } from "lucide-react";

import { DwelluneLine } from "@/components/ui/controls";
import {
  formatPkr,
  type ProductDetailData,
  type RelatedProductSummary,
} from "@/lib/product-detail";

import { ProductExperience } from "./product-experience";
import { RecentlyViewed } from "./recently-viewed";
import styles from "./product-detail.module.css";

type ProductDetailViewProps = {
  product: ProductDetailData;
  relatedProducts: RelatedProductSummary[];
  requestedSku?: string;
};

function specificationEntries(specifications: Record<string, unknown>) {
  return Object.entries(specifications).flatMap(([key, value]) => {
    if (key === "test_product") return [];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return [[key, String(value)] as const];
    }
    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === "string" || typeof item === "number")
    ) {
      return [[key, value.join(", ")] as const];
    }
    return [];
  });
}

function displayPrice(product: RelatedProductSummary) {
  if (product.minPricePkr === null) return "Price on request";
  if (product.maxPricePkr && product.maxPricePkr !== product.minPricePkr) {
    return `${formatPkr(product.minPricePkr)} – ${formatPkr(product.maxPricePkr)}`;
  }
  return formatPkr(product.minPricePkr);
}

function RelatedProducts({ products }: { products: RelatedProductSummary[] }) {
  if (!products.length) return null;

  return (
    <section className={styles.relatedSection} aria-labelledby="related-title">
      <header className={styles.sectionHeading}>
        <p>Continue through the house</p>
        <h2 id="related-title">Objects with a shared language</h2>
      </header>
      <div className={styles.relatedGrid} role="list">
        {products.map((product) => (
          <article className={styles.relatedItem} key={product.id} role="listitem">
            <Link href={`/products/${product.slug}` as Route}>
              <div className={styles.relatedStage}>
                {product.mediaUrl ? (
                  <Image
                    alt={product.mediaAlt ?? product.name}
                    fill
                    sizes="(max-width: 42rem) 46vw, (max-width: 72rem) 30vw, 22vw"
                    src={product.mediaUrl}
                  />
                ) : (
                  <PackageOpen aria-hidden="true" />
                )}
                <span>{product.inStock ? "In stock" : "Unavailable"}</span>
              </div>
              <div className={styles.relatedCopy}>
                <DwelluneLine />
                <p>{product.material ?? product.productType}</p>
                <h3>{product.name}</h3>
                <strong>{displayPrice(product)}</strong>
                <span className={styles.relatedCue}>
                  View object <ArrowRight aria-hidden="true" />
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProductDetailView({
  product,
  relatedProducts,
  requestedSku,
}: ProductDetailViewProps) {
  const specs = specificationEntries(product.specifications);
  const firstPrice = product.variants.length
    ? Math.min(...product.variants.map((variant) => variant.pricePkr))
    : null;
  const currentMedia =
    product.media.find((media) => media.mediaType === "image" && media.url)?.url ?? null;

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href={"/shop" as Route}>Shop</Link>
        <span aria-hidden="true">/</span>
        {product.primaryCategory ? (
          <>
            <Link href={`/categories/${product.primaryCategory.slug}` as Route}>
              {product.primaryCategory.name}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        ) : null}
        <span aria-current="page">{product.name}</span>
      </nav>

      <ProductExperience product={product} requestedSku={requestedSku} />

      <section className={styles.storySection} aria-labelledby="product-story-title">
        <div className={styles.storyHeading}>
          <p>Object story</p>
          <h2 id="product-story-title">Made to belong in the room.</h2>
        </div>
        <div className={styles.storyBody}>
          {product.description ? <p className={styles.storyLead}>{product.description}</p> : null}

          <div className={styles.detailColumns}>
            {product.materialSummary ? (
              <article>
                <p>Materials</p>
                <h3>What it is made from</h3>
                <p>{product.materialSummary}</p>
              </article>
            ) : null}
            {product.careInstructions ? (
              <article>
                <p>Care</p>
                <h3>Keep it at its best</h3>
                <p>{product.careInstructions}</p>
              </article>
            ) : null}
          </div>

          {specs.length ? (
            <dl className={styles.specifications}>
              {specs.map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replaceAll("_", " ")}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

      <RelatedProducts products={relatedProducts} />

      <RecentlyViewed
        current={{
          slug: product.slug,
          name: product.name,
          mediaUrl: currentMedia,
          pricePkr: firstPrice,
        }}
      />
    </main>
  );
}
