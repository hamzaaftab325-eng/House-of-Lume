export const CATALOGUE_PAGE_SIZE = 12;

export const catalogueSortValues = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
  "name-asc",
] as const;

export type CatalogueSort = (typeof catalogueSortValues)[number];
export type AvailabilityFilter = "in-stock" | "out-of-stock";

export type CatalogueQuery = {
  category?: string;
  availability?: AvailabilityFilter;
  minPrice?: number;
  maxPrice?: number;
  material?: string;
  color?: string;
  sort: CatalogueSort;
  page: number;
  q?: string;
};

export type CatalogueScope = {
  category?: string;
  collection?: string;
};

export type CatalogueProduct = {
  id: string;
  productType: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  materialSummary: string | null;
  publishedAt: string;
  primaryCategorySlug: string | null;
  categorySlugs: string[];
  collectionSlugs: string[];
  minPricePkr: number | null;
  maxPricePkr: number | null;
  inStock: boolean;
  materials: string[];
  colors: string[];
  primaryMediaPath: string | null;
  primaryMediaAlt: string | null;
};

export type CataloguePageResult = {
  products: CatalogueProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CatalogueFacets = {
  materials: string[];
  colors: string[];
  minPricePkr: number | null;
  maxPricePkr: number | null;
};

export type CatalogueCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
};

export type CatalogueCollection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
};

export type CataloguePageData = {
  result: CataloguePageResult;
  facets: CatalogueFacets;
  categories: CatalogueCategory[];
  collections: CatalogueCollection[];
};

export type SearchSuggestionProduct = Pick<
  CatalogueProduct,
  "id" | "name" | "slug" | "productType" | "minPricePkr" | "inStock"
>;

export type SearchSuggestionEditorial = {
  id: string;
  name: string;
  description: string;
  href: string;
};

export type SearchSuggestions = {
  products: SearchSuggestionProduct[];
  categories: CatalogueCategory[];
  collections: CatalogueCollection[];
  editorial: SearchSuggestionEditorial[];
};
