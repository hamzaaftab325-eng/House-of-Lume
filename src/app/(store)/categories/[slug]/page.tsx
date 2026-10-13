import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogueView } from "@/components/catalogue/catalogue-view";
import { getCataloguePageData, getCategoryBySlug } from "@/server/catalogue/service";
import { parseCatalogueQuery, type RawSearchParams } from "@/server/catalogue/validation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };

  return {
    title: category.name,
    description:
      category.description ?? `Explore the ${category.name.toLowerCase()} edit at House of Lume.`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const query = parseCatalogueQuery(await searchParams);
  const data = await getCataloguePageData(query, { category: category.slug });

  return (
    <CatalogueView
      basePath={`/categories/${category.slug}`}
      eyebrow="Shop by category"
      title={category.name}
      description={
        category.description ??
        `Explore House of Lume ${category.name.toLowerCase()} through material, atmosphere, and use.`
      }
      query={{ ...query, category: undefined }}
      data={data}
      showCategoryFilter={false}
    />
  );
}
