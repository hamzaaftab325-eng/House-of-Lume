import "server-only";

import { cache } from "react";

import { editorialSearchItems } from "./editorial";
import {
  listCatalogueCategories,
  listCatalogueCollections,
  queryCatalogueFacets,
  queryCatalogueProducts,
} from "./repository";
import type {
  CatalogueCategory,
  CatalogueCollection,
  CataloguePageData,
  CatalogueQuery,
  CatalogueScope,
  SearchSuggestions,
} from "./types";

const getCategories = cache(listCatalogueCategories);
const getCollections = cache(listCatalogueCollections);

export async function getCataloguePageData(
  query: CatalogueQuery,
  scope: CatalogueScope = {},
): Promise<CataloguePageData> {
  const facetScope: CatalogueScope = {
    category: scope.category ?? query.category,
    collection: scope.collection,
  };

  const [result, facets, categories, collections] = await Promise.all([
    queryCatalogueProducts(query, scope),
    queryCatalogueFacets(facetScope),
    getCategories(),
    getCollections(),
  ]);

  return { result, facets, categories, collections };
}

export async function getCategoryBySlug(slug: string): Promise<CatalogueCategory | null> {
  const categories = await getCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function getCollectionBySlug(slug: string): Promise<CatalogueCollection | null> {
  const collections = await getCollections();
  return collections.find((collection) => collection.slug === slug) ?? null;
}

export async function getSearchSuggestions(query: string): Promise<SearchSuggestions> {
  const [productResult, categories, collections] = await Promise.all([
    queryCatalogueProducts(
      {
        sort: "featured",
        page: 1,
        q: query,
      },
      {},
      6,
    ),
    getCategories(),
    getCollections(),
  ]);

  const normalizedQuery = query.toLocaleLowerCase("en");
  const matches = (value: string) => value.toLocaleLowerCase("en").includes(normalizedQuery);

  return {
    products: productResult.products.slice(0, 6).map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      productType: product.productType,
      minPricePkr: product.minPricePkr,
      inStock: product.inStock,
    })),
    categories: categories
      .filter((category) => matches(category.name) || matches(category.description ?? ""))
      .slice(0, 4),
    collections: collections
      .filter((collection) => matches(collection.name) || matches(collection.description ?? ""))
      .slice(0, 4),
    editorial: editorialSearchItems
      .filter((item) => matches(item.name) || matches(item.description))
      .slice(0, 4),
  };
}
