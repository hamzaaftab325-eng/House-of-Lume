import { z } from "zod";

import {
  catalogueSortValues,
  type AvailabilityFilter,
  type CatalogueQuery,
  type CatalogueSort,
} from "./types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const cleanText = (value: string | string[] | undefined, maxLength = 80) => {
  const parsed = first(value)?.trim();
  if (!parsed) return undefined;
  return parsed.slice(0, maxLength);
};

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const availabilitySchema = z.enum(["in-stock", "out-of-stock"]);
const sortSchema = z.enum(catalogueSortValues);

const parsePositiveInteger = (
  value: string | string[] | undefined,
  fallback: number,
  maximum: number,
) => {
  const candidate = Number(first(value));
  if (!Number.isInteger(candidate) || candidate < 1) return fallback;
  return Math.min(candidate, maximum);
};

const parseMoney = (value: string | string[] | undefined) => {
  const raw = first(value)?.trim();
  if (!raw) return undefined;
  const candidate = Number(raw);
  if (!Number.isFinite(candidate) || candidate < 0) return undefined;
  return Math.min(Math.round(candidate), 100_000_000);
};

const parseSlug = (value: string | string[] | undefined) => {
  const candidate = cleanText(value, 80)?.toLowerCase();
  if (!candidate) return undefined;
  const parsed = slugSchema.safeParse(candidate);
  return parsed.success ? parsed.data : undefined;
};

export function parseCatalogueQuery(searchParams: RawSearchParams): CatalogueQuery {
  const availabilityCandidate = availabilitySchema.safeParse(first(searchParams.availability));
  const sortCandidate = sortSchema.safeParse(first(searchParams.sort));
  const minPrice = parseMoney(searchParams.minPrice);
  const maxPrice = parseMoney(searchParams.maxPrice);

  return {
    category: parseSlug(searchParams.category),
    availability: availabilityCandidate.success
      ? (availabilityCandidate.data as AvailabilityFilter)
      : undefined,
    minPrice,
    maxPrice,
    material: cleanText(searchParams.material),
    color: cleanText(searchParams.color),
    sort: sortCandidate.success ? (sortCandidate.data as CatalogueSort) : "featured",
    page: parsePositiveInteger(searchParams.page, 1, 10_000),
    q: cleanText(searchParams.q, 96),
  };
}

export const predictiveSearchQuerySchema = z
  .string()
  .trim()
  .min(2)
  .max(96)
  .transform((value) => value.replace(/\s+/g, " "));

export function normalizePredictiveSearchQuery(value: string | null) {
  const parsed = predictiveSearchQuerySchema.safeParse(value ?? "");
  return parsed.success ? parsed.data : null;
}
