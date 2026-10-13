import { z } from "zod";

import type { CatalogueFilters } from "@/lib/catalogue";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  position: z.number(),
});

const collectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  position: z.number(),
});

const productSchema = z.object({
  id: z.string().uuid(),
  product_type: z.string(),
  name: z.string(),
  slug: z.string(),
  short_description: z.string().nullable(),
  material_summary: z.string().nullable(),
  published_at: z.string().nullable(),
  primary_category_slug: z.string().nullable(),
  category_slugs: z.array(z.string()).default([]),
  collection_slugs: z.array(z.string()).default([]),
  min_price_pkr: z.number().nullable(),
  max_price_pkr: z.number().nullable(),
  in_stock: z.boolean(),
  materials: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  primary_media_path: z.string().nullable(),
  primary_media_alt: z.string().nullable(),
  total_count: z.number(),
});

const facetsSchema = z.object({
  materials: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  minPricePkr: z.number().nullable().optional(),
  maxPricePkr: z.number().nullable().optional(),
});

export type CatalogueCategory = z.infer<typeof categorySchema>;
export type CatalogueCollection = z.infer<typeof collectionSchema>;
export type CatalogueProduct = z.infer<typeof productSchema>;
export type CatalogueFacets = z.infer<typeof facetsSchema>;

export type CatalogueResult = {
  products: CatalogueProduct[];
  totalCount: number;
  categories: CatalogueCategory[];
  collections: CatalogueCollection[];
  facets: CatalogueFacets;
};

const PAGE_SIZE = 24;
const isCiPlaceholder = env.NEXT_PUBLIC_SUPABASE_URL === "https://example.supabase.co";
const emptyFacets: CatalogueFacets = {
  materials: [],
  colors: [],
  minPricePkr: null,
  maxPricePkr: null,
};

function databaseError(scope: string, message: string) {
  return new Error(`Catalogue ${scope} failed: ${message}`);
}

export async function getCatalogueNavigation() {
  if (isCiPlaceholder) return { categories: [], collections: [] };
  const supabase = await createClient();
  const [categoriesResult, collectionsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,slug,description,position")
      .eq("is_active", true)
      .order("position", { ascending: true }),
    supabase
      .from("collections")
      .select("id,name,slug,description,position")
      .eq("is_active", true)
      .order("position", { ascending: true }),
  ]);

  if (categoriesResult.error) throw databaseError("categories", categoriesResult.error.message);
  if (collectionsResult.error) throw databaseError("collections", collectionsResult.error.message);

  return {
    categories: z.array(categorySchema).parse(categoriesResult.data ?? []),
    collections: z.array(collectionSchema).parse(collectionsResult.data ?? []),
  };
}

export async function getCategory(slug: string) {
  if (isCiPlaceholder) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,position")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw databaseError("category", error.message);
  return data ? categorySchema.parse(data) : null;
}

export async function getCollection(slug: string) {
  if (isCiPlaceholder) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id,name,slug,description,position")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw databaseError("collection", error.message);
  return data ? collectionSchema.parse(data) : null;
}

export async function getCatalogue(filters: CatalogueFilters): Promise<CatalogueResult> {
  if (isCiPlaceholder) {
    return {
      products: [],
      totalCount: 0,
      categories: [],
      collections: [],
      facets: emptyFacets,
    };
  }

  const supabase = await createClient();
  const offset = (filters.page - 1) * PAGE_SIZE;
  const category = filters.category ?? null;
  const collection = filters.collection ?? null;

  const [productsResult, facetsResult, navigation] = await Promise.all([
    supabase.rpc("catalogue_products", {
      p_category: category,
      p_collection: collection,
      p_availability: filters.availability ?? null,
      p_min_price: filters.minPrice ?? null,
      p_max_price: filters.maxPrice ?? null,
      p_material: filters.material ?? null,
      p_color: filters.color ?? null,
      p_search: filters.q ?? null,
      p_sort: filters.sort,
      p_limit: PAGE_SIZE,
      p_offset: offset,
    }),
    supabase.rpc("catalogue_facets", {
      p_category: category,
      p_collection: collection,
    }),
    getCatalogueNavigation(),
  ]);

  if (productsResult.error) throw databaseError("products", productsResult.error.message);
  if (facetsResult.error) throw databaseError("facets", facetsResult.error.message);

  const products = z.array(productSchema).parse(productsResult.data ?? []);
  const facets = facetsSchema.parse(facetsResult.data ?? {});

  return {
    products,
    totalCount: products[0]?.total_count ?? 0,
    facets,
    ...navigation,
  };
}

const suggestionProductSchema = productSchema.pick({
  name: true,
  slug: true,
  product_type: true,
});
const suggestionDestinationSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
});

export type SearchSuggestions = {
  products: Array<z.infer<typeof suggestionProductSchema>>;
  categories: Array<z.infer<typeof suggestionDestinationSchema>>;
  collections: Array<z.infer<typeof suggestionDestinationSchema>>;
};

export async function getSearchSuggestions(query: string): Promise<SearchSuggestions> {
  if (isCiPlaceholder) return { products: [], categories: [], collections: [] };
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return { products: [], categories: [], collections: [] };

  const supabase = await createClient();
  const [productsResult, categoriesResult, collectionsResult] = await Promise.all([
    supabase.rpc("catalogue_products", {
      p_search: q,
      p_sort: "featured",
      p_limit: 5,
      p_offset: 0,
    }),
    supabase
      .from("categories")
      .select("name,slug,description")
      .eq("is_active", true)
      .ilike("name", `%${q}%`)
      .order("position", { ascending: true })
      .limit(4),
    supabase
      .from("collections")
      .select("name,slug,description")
      .eq("is_active", true)
      .ilike("name", `%${q}%`)
      .order("position", { ascending: true })
      .limit(4),
  ]);

  if (productsResult.error) throw databaseError("search products", productsResult.error.message);
  if (categoriesResult.error) throw databaseError("search categories", categoriesResult.error.message);
  if (collectionsResult.error) throw databaseError("search collections", collectionsResult.error.message);

  return {
    products: z.array(suggestionProductSchema).parse(productsResult.data ?? []),
    categories: z.array(suggestionDestinationSchema).parse(categoriesResult.data ?? []),
    collections: z.array(suggestionDestinationSchema).parse(collectionsResult.data ?? []),
  };
}

export const cataloguePageSize = PAGE_SIZE;
