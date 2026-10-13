import { describe, expect, it } from "vitest";

import { activeFilterCount, catalogueQueryString, parseCatalogueFilters } from "./catalogue";

describe("catalogue filters", () => {
  it("normalizes invalid public query state", () => {
    expect(
      parseCatalogueFilters({
        availability: "unknown",
        minPrice: "-1",
        maxPrice: "abc",
        page: "0",
        sort: "popular",
      }),
    ).toMatchObject({ sort: "featured", page: 1 });
  });

  it("serializes only meaningful state", () => {
    const filters = parseCatalogueFilters({
      category: "lighting",
      sort: "price-asc",
      page: "2",
    });
    expect(catalogueQueryString(filters)).toBe("category=lighting&sort=price-asc&page=2");
    expect(activeFilterCount(filters)).toBe(1);
  });
});
