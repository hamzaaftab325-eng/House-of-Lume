import { describe, expect, it } from "vitest";

import {
  initialVariant,
  isCodEligible,
  mediaForVariant,
  normalizeQuantity,
  variantForSelectionChange,
  variantQuantityLimit,
  variantStockLabel,
  type ProductMediaItem,
  type ProductOption,
  type ProductVariant,
} from "./product-detail";

const optionValues = {
  brass: "11111111-1111-4111-8111-111111111501",
  black: "11111111-1111-4111-8111-111111111502",
  medium: "11111111-1111-4111-8111-111111111503",
  large: "11111111-1111-4111-8111-111111111504",
};

const options: ProductOption[] = [
  {
    id: "11111111-1111-4111-8111-111111111401",
    name: "Finish",
    slug: "finish",
    position: 10,
    values: [
      { id: optionValues.brass, value: "Warm Brass", swatchHex: "#96744D", position: 10 },
      { id: optionValues.black, value: "Ink Black", swatchHex: "#1E1D1A", position: 20 },
    ],
  },
  {
    id: "11111111-1111-4111-8111-111111111402",
    name: "Size",
    slug: "size",
    position: 20,
    values: [
      { id: optionValues.medium, value: "Medium", swatchHex: null, position: 10 },
      { id: optionValues.large, value: "Large", swatchHex: null, position: 20 },
    ],
  },
];

const variants: ProductVariant[] = [
  {
    id: "11111111-1111-4111-8111-111111111301",
    sku: "BRASS-M",
    title: "Warm Brass / Medium",
    pricePkr: 18000,
    compareAtPricePkr: null,
    weightGrams: null,
    dimensionsCm: {},
    attributes: {},
    trackInventory: true,
    optionValueIds: [optionValues.brass, optionValues.medium],
    availableQuantity: 3,
    inStock: true,
    lowStock: true,
  },
  {
    id: "11111111-1111-4111-8111-111111111302",
    sku: "BLACK-L",
    title: "Ink Black / Large",
    pricePkr: 22000,
    compareAtPricePkr: null,
    weightGrams: null,
    dimensionsCm: {},
    attributes: {},
    trackInventory: true,
    optionValueIds: [optionValues.black, optionValues.large],
    availableQuantity: 0,
    inStock: false,
    lowStock: false,
  },
];

describe("product detail domain", () => {
  it("selects a requested variant or first stocked fallback", () => {
    expect(initialVariant(variants, "BLACK-L")?.sku).toBe("BLACK-L");
    expect(initialVariant(variants, "missing")?.sku).toBe("BRASS-M");
  });

  it("moves to the variant containing the changed option value", () => {
    const next = variantForSelectionChange(variants, options, variants[0]!, "finish", optionValues.black);
    expect(next.sku).toBe("BLACK-L");
  });

  it("caps quantity against tracked availability", () => {
    expect(variantQuantityLimit(variants[0]!)).toBe(3);
    expect(normalizeQuantity(12, variants[0]!)).toBe(3);
    expect(normalizeQuantity(-4, variants[0]!)).toBe(1);
    expect(normalizeQuantity(2, variants[1]!)).toBe(0);
  });

  it("evaluates COD thresholds from server policy", () => {
    const policy = {
      codEnabled: true,
      codMinOrderPkr: 5000,
      codMaxOrderPkr: 25000,
      estimatedDaysMin: 2,
      estimatedDaysMax: 7,
      flatFeePkr: 250,
      freeShippingThresholdPkr: 5000,
    };
    expect(isCodEligible(6000, 1, policy)).toBe(true);
    expect(isCodEligible(3000, 1, policy)).toBe(false);
    expect(isCodEligible(15000, 2, policy)).toBe(false);
  });

  it("prioritizes variant-specific media before shared media", () => {
    const media: ProductMediaItem[] = [
      {
        id: "11111111-1111-4111-8111-111111111201",
        variantId: null,
        mediaType: "image",
        url: "https://example.test/shared.png",
        altText: null,
        width: null,
        height: null,
        position: 0,
        isPrimary: true,
      },
      {
        id: "11111111-1111-4111-8111-111111111202",
        variantId: variants[0]!.id,
        mediaType: "image",
        url: "https://example.test/variant.png",
        altText: null,
        width: null,
        height: null,
        position: 0,
        isPrimary: true,
      },
    ];
    expect(mediaForVariant(media, variants[0]!.id).map((item) => item.id)).toEqual([
      "11111111-1111-4111-8111-111111111202",
      "11111111-1111-4111-8111-111111111201",
    ]);
  });

  it("reports clear stock language", () => {
    expect(variantStockLabel(variants[0]!)).toBe("Low stock");
    expect(variantStockLabel(variants[1]!)).toBe("Currently unavailable");
  });
});
