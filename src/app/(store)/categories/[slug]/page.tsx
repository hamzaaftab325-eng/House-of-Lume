import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogueView } from "@/components/catalogue/catalogue";
import { parseCatalogueFilters, type SearchParamsInput } from "@/lib/catalogue";
import { getCatalogue, getCategory } from "@/server/catalogue/catalogue.service";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsInput>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category not found | House of Lume" };

  return {
    title: `${category.name} | House of Lume`,
    description: category.description ?? `Explore ${category.name.toLowerCase()} at House of Lume.`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const filters = { ...parseCatalogueFilters(await searchParams), category: slug };
  const catalogue = await getCatalogue(filters);

  return (
    <CatalogueView
      eyebrow="Shop by category"
      title={category.name}
      description={
        category.description ?? `A considered edit of ${category.name.toLowerCase()} for the House.`
      }
      basePath="/shop"
      filters={filters}
      {...catalogue}
    />
  );
}
