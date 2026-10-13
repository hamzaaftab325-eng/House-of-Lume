import { describe, expect, it } from "vitest";

import { normalizePredictiveSearchQuery, parseCatalogueQuery } from "./validation";

describe("parseCatalogueQuery", () => {
  it("parses supported catalogue state", () => {
    expect(
      parseCatalogueQuery({
        category: "lighting",
        availability: "in-stock",
        minPrice: "5000",
        maxPrice: "25000",
        material: "Brass",
        color: "Warm Brass",
        sort: "price-asc",
        page: "3",
        q: "floor lamp",
      }),
    ).toEqual({
      category: "lighting",
      availability: "in-stock",
      minPrice: 5000,
      maxPrice: 25000,
      material: "Brass",
      color: "Warm Brass",
      sort: "price-asc",
      page: 3,
      q: "floor lamp",
    });
  });

  it("drops invalid filter values instead of trusting the URL", () => {
    expect(
      parseCatalogueQuery({
        category: "../../admin",
        availability: "everything",
        minPrice: "-4",
        maxPrice: "NaN",
        sort: "DROP TABLE",
        page: "-2",
      }),
    ).toEqual({
      category: undefined,
      availability: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      material: undefined,
      color: undefined,
      sort: "featured",
      page: 1,
      q: undefined,
    });
  });

  it("uses only the first value for duplicated query parameters", () => {
    expect(
      parseCatalogueQuery({ page: ["2", "99"], sort: ["newest", "price-desc"] }),
    ).toMatchObject({
      page: 2,
      sort: "newest",
    });
  });
});

describe("normalizePredictiveSearchQuery", () => {
  it("normalizes useful search terms", () => {
    expect(normalizePredictiveSearchQuery("  warm   lighting  ")).toBe("warm lighting");
  });

  it("rejects very short predictive requests", () => {
    expect(normalizePredictiveSearchQuery("a")).toBeNull();
  });
});
