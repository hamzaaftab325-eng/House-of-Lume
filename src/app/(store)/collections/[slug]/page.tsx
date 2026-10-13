import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogueView } from "@/components/catalogue/catalogue-view";
import { getCataloguePageData, getCollectionBySlug } from "@/server/catalogue/service";
import { parseCatalogueQuery, type RawSearchParams } from "@/server/catalogue/validation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Collection not found" };

  return {
    title: collection.name,
    description:
      collection.description ?? `Explore the ${collection.name} collection at House of Lume.`,
    alternates: { canonical: `/collections/${collection.slug}` },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const query = parseCatalogueQuery(await searchParams);
  const data = await getCataloguePageData(query, { collection: collection.slug });

  return (
    <CatalogueView
      basePath={`/collections/${collection.slug}`}
      eyebrow="Curated collection"
      title={collection.name}
      description={
        collection.description ??
        "A focused edit of House of Lume objects brought together by atmosphere, material, and use."
      }
      query={query}
      data={data}
    />
  );
}
