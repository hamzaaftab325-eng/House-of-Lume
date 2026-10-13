import "server-only";

import type {
  CatalogueCategory,
  CatalogueCollection,
  CatalogueFacets,
  CataloguePageResult,
} from "./types";

export const ciCatalogueCategories: CatalogueCategory[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Lighting",
    slug: "lighting",
    description: "Lamps and considered lighting for warm, lived-in rooms.",
    position: 10,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Plants",
    slug: "plants",
    description: "Indoor plants selected for calm, natural living spaces.",
    position: 20,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Planters",
    slug: "planters",
    description: "Planters and pots in ceramic, terracotta and natural finishes.",
    position: 30,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Décor",
    slug: "decor",
    description: "Decorative objects and finishing pieces for the home.",
    position: 40,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    name: "Candles",
    slug: "candles",
    description: "Candles and warm ambient objects.",
    position: 50,
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    name: "Mirrors",
    slug: "mirrors",
    description: "Mirrors for light, depth and spatial character.",
    position: 60,
  },
];

export const ciCatalogueCollections: CatalogueCollection[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "New Arrivals",
    slug: "new-arrivals",
    description: "The newest objects added to House of Lume.",
    position: 10,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Warm Lighting",
    slug: "warm-lighting",
    description: "Lighting chosen for warm atmosphere and evening rooms.",
    position: 20,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    name: "Living Green",
    slug: "living-green",
    description: "Plants and planters for bringing natural life indoors.",
    position: 30,
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    name: "House Essentials",
    slug: "house-essentials",
    description: "Considered everyday objects for a warmer home.",
    position: 40,
  },
];

export const ciEmptyCatalogueResult: CataloguePageResult = {
  products: [],
  totalCount: 0,
  page: 1,
  pageSize: 12,
  totalPages: 1,
};

export const ciEmptyCatalogueFacets: CatalogueFacets = {
  materials: [],
  colors: [],
  minPricePkr: null,
  maxPricePkr: null,
};
