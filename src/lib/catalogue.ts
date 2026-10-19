const catalogueSorts = ["featured", "newest", "price-asc", "price-desc", "name-asc"] as const;
const catalogueAvailability = ["in-stock", "out-of-stock"] as const;

type CatalogueSort = (typeof catalogueSorts)[number];
type CatalogueAvailability = (typeof catalogueAvailability)[number];
export type SearchParamsInput = Record<string, string | string[] | undefined>;

export type CatalogueFilters = {
  category?: string;
  collection?: string;
  availability?: CatalogueAvailability;
  minPrice?: number;
  maxPrice?: number;
  material?: string;
  color?: string;
  q?: string;
  sort: CatalogueSort;
  page: number;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function cleanText(value: string | undefined, max = 80) {
  const cleaned = value?.trim();
  return cleaned ? cleaned.slice(0, max) : undefined;
}

function positiveNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : undefined;
}

export function parseCatalogueFilters(input: SearchParamsInput): CatalogueFilters {
  const sortValue = first(input.sort);
  const availabilityValue = first(input.availability);
  const pageValue = Number(first(input.page) ?? "1");
  const minPrice = positiveNumber(first(input.minPrice));
  const maxPrice = positiveNumber(first(input.maxPrice));

  return {
    category: cleanText(first(input.category)),
    collection: cleanText(first(input.collection)),
    availability: catalogueAvailability.includes(availabilityValue as CatalogueAvailability)
      ? (availabilityValue as CatalogueAvailability)
      : undefined,
    minPrice,
    maxPrice:
      maxPrice !== undefined && minPrice !== undefined && maxPrice < minPrice
        ? undefined
        : maxPrice,
    material: cleanText(first(input.material)),
    color: cleanText(first(input.color)),
    q: cleanText(first(input.q), 120),
    sort: catalogueSorts.includes(sortValue as CatalogueSort)
      ? (sortValue as CatalogueSort)
      : "featured",
    page: Number.isInteger(pageValue) && pageValue > 0 ? Math.min(pageValue, 500) : 1,
  };
}

export function catalogueQueryString(
  filters: CatalogueFilters,
  updates: Partial<CatalogueFilters> = {},
) {
  const next = { ...filters, ...updates };
  const params = new URLSearchParams();

  if (next.category) params.set("category", next.category);
  if (next.collection) params.set("collection", next.collection);
  if (next.availability) params.set("availability", next.availability);
  if (next.minPrice !== undefined) params.set("minPrice", String(next.minPrice));
  if (next.maxPrice !== undefined) params.set("maxPrice", String(next.maxPrice));
  if (next.material) params.set("material", next.material);
  if (next.color) params.set("color", next.color);
  if (next.q) params.set("q", next.q);
  if (next.sort !== "featured") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));

  return params.toString();
}

export function catalogueHref(
  basePath: string,
  filters: CatalogueFilters,
  updates: Partial<CatalogueFilters> = {},
) {
  const query = catalogueQueryString(filters, updates);
  return query ? `${basePath}?${query}` : basePath;
}

export function activeFilterCount(filters: CatalogueFilters) {
  return [
    filters.category,
    filters.collection,
    filters.availability,
    filters.minPrice,
    filters.maxPrice,
    filters.material,
    filters.color,
    filters.q,
  ].filter((value) => value !== undefined && value !== "").length;
}
