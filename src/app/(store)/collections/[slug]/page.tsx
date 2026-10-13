import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogueView } from "@/components/catalogue/catalogue";
import { parseCatalogueFilters, type SearchParamsInput } from "@/lib/catalogue";
import { getCatalogue, getCollection } from "@/server/catalogue/catalogue.service";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsInput>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return { title: "Collection not found | House of Lume" };

  return {
    title: `${collection.name} | House of Lume`,
    description:
      collection.description ?? `Explore the ${collection.name} collection at House of Lume.`,
    alternates: { canonical: `/collections/${collection.slug}` },
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  const filters = { ...parseCatalogueFilters(await searchParams), collection: slug };
  const catalogue = await getCatalogue(filters);

  return (
    <CatalogueView
      eyebrow="Curated collection"
      title={collection.name}
      description={
        collection.description ??
        "A quieter edit of objects brought together by atmosphere, material, and use."
      }
      basePath="/shop"
      filters={filters}
      {...catalogue}
    />
  );
}
