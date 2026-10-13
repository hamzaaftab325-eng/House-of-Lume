import "server-only";

import { z } from "zod";

import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

import {
  ciCatalogueCategories,
  ciCatalogueCollections,
  ciEmptyCatalogueFacets,
  ciEmptyCatalogueResult,
} from "./ci-fixture";
import {
  CATALOGUE_PAGE_SIZE,
  type CatalogueCategory,
  type CatalogueCollection,
  type CatalogueFacets,
  type CataloguePageResult,
  type CatalogueProduct,
  type CatalogueQuery,
  type CatalogueScope,
} from "./types";

const isCiFixtureMode = env.NEXT_PUBLIC_SUPABASE_URL === "https://example.supabase.co";

const categoryRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  position: z.coerce.number().int(),
});

const collectionRowSchema = categoryRowSchema;

const productRowSchema = z.object({
  id: z.string().uuid(),
  product_type: z.string(),
  name: z.string(),
  slug: z.string(),
  short_description: z.string().nullable(),
  material_summary: z.string().nullable(),
  published_at: z.string(),
  primary_category_slug: z.string().nullable(),
  category_slugs: z.array(z.string()).default([]),
  collection_slugs: z.array(z.string()).default([]),
  min_price_pkr: z.coerce.number().int().nonnegative().nullable(),
  max_price_pkr: z.coerce.number().int().nonnegative().nullable(),
  in_stock: z.boolean(),
  materials: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  primary_media_path: z.string().nullable(),
  primary_media_alt: z.string().nullable(),
  total_count: z.coerce.number().int().nonnegative(),
});

const facetsSchema = z.object({
  materials: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  minPricePkr: z.coerce.number().int().nonnegative().nullable(),
  maxPricePkr: z.coerce.number().int().nonnegative().nullable(),
});

export class CatalogueDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogueDataError";
  }
}

function toProduct(row: z.infer<typeof productRowSchema>): CatalogueProduct {
  return {
    id: row.id,
    productType: row.product_type,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description,
    materialSummary: row.material_summary,
    publishedAt: row.published_at,
    primaryCategorySlug: row.primary_category_slug,
    categorySlugs: row.category_slugs,
    collectionSlugs: row.collection_slugs,
    minPricePkr: row.min_price_pkr,
    maxPricePkr: row.max_price_pkr,
    inStock: row.in_stock,
    materials: row.materials,
    colors: row.colors,
    primaryMediaPath: row.primary_media_path,
    primaryMediaAlt: row.primary_media_alt,
  };
}

export async function listCatalogueCategories(): Promise<CatalogueCategory[]> {
  if (isCiFixtureMode) return ciCatalogueCategories;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,position")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new CatalogueDataError("The category catalogue could not be loaded.");

  return categoryRowSchema.array().parse(data ?? []);
}

export async function listCatalogueCollections(): Promise<CatalogueCollection[]> {
  if (isCiFixtureMode) return ciCatalogueCollections;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id,name,slug,description,position")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new CatalogueDataError("The collection catalogue could not be loaded.");

  return collectionRowSchema.array().parse(data ?? []);
}

export async function queryCatalogueProducts(
  query: CatalogueQuery,
  scope: CatalogueScope = {},
  pageSize = CATALOGUE_PAGE_SIZE,
): Promise<CataloguePageResult> {
  if (isCiFixtureMode) return ciEmptyCatalogueResult;

  const supabase = await createClient();
  const requestedPage = Math.max(1, query.page);
  const offset = (requestedPage - 1) * pageSize;

  const { data, error } = await supabase.rpc("catalogue_products", {
    p_category: scope.category ?? query.category ?? null,
    p_collection: scope.collection ?? null,
    p_availability: query.availability ?? null,
    p_min_price: query.minPrice ?? null,
    p_max_price: query.maxPrice ?? null,
    p_material: query.material ?? null,
    p_color: query.color ?? null,
    p_search: query.q ?? null,
    p_sort: query.sort,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) throw new CatalogueDataError("Products could not be loaded right now.");

  const parsedRows = productRowSchema.array().parse(data ?? []);
  const totalCount = parsedRows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = totalCount > 0 ? Math.min(requestedPage, totalPages) : 1;

  if (page !== requestedPage) {
    return queryCatalogueProducts({ ...query, page }, scope, pageSize);
  }

  return {
    products: parsedRows.map(toProduct),
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

export async function queryCatalogueFacets(scope: CatalogueScope = {}): Promise<CatalogueFacets> {
  if (isCiFixtureMode) return ciEmptyCatalogueFacets;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("catalogue_facets", {
    p_category: scope.category ?? null,
    p_collection: scope.collection ?? null,
  });

  if (error) throw new CatalogueDataError("Catalogue filters could not be loaded right now.");

  return facetsSchema.parse(
    data ?? { materials: [], colors: [], minPricePkr: null, maxPricePkr: null },
  );
}
