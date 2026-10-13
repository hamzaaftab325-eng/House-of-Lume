import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailView } from "@/components/product/product-detail";
import { env } from "@/lib/env";
import { getProductDetail } from "@/server/catalogue/product-detail.service";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string | string[] }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductDetail(slug);
  if (!result) return {};

  const { product } = result;
  const canonical = `/products/${product.slug}`;
  const image = product.media.find((item) => item.mediaType === "image" && item.url)?.url;

  return {
    title: product.seoTitle ?? `${product.name} | House of Lume`,
    description:
      product.seoDescription ?? product.shortDescription ?? product.description ?? undefined,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: product.seoTitle ?? product.name,
      description: product.seoDescription ?? product.shortDescription ?? undefined,
      url: canonical,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const result = await getProductDetail(slug);
  if (!result) notFound();

  const { product, relatedProducts } = result;
  const requestedSku = first(query.variant)?.trim().slice(0, 100);
  const imageUrls = product.media.flatMap((item) =>
    item.mediaType === "image" && item.url ? [item.url] : [],
  );
  const offers = product.variants.map((variant) => ({
    "@type": "Offer",
    sku: variant.sku,
    priceCurrency: "PKR",
    price: variant.pricePkr,
    availability: variant.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    url: `${env.NEXT_PUBLIC_SITE_URL}/products/${product.slug}?variant=${encodeURIComponent(variant.sku)}`,
  }));
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    image: imageUrls.length ? imageUrls : undefined,
    brand: { "@type": "Brand", name: "House of Lume" },
    category: product.primaryCategory?.name,
    offers: offers.length ? offers : undefined,
    aggregateRating:
      product.reviewSummary.count > 0 && product.reviewSummary.averageRating
        ? {
            "@type": "AggregateRating",
            ratingValue: product.reviewSummary.averageRating,
            reviewCount: product.reviewSummary.count,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
        requestedSku={requestedSku}
      />
    </>
  );
}
