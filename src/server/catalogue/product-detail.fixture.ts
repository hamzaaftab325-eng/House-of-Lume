import type { ProductDetailData, RelatedProductSummary } from "@/lib/product-detail";

const lampMedia = [
  "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/f36d05ea-566c-4c14-ac8c-ccd887d8d588_vnqway.png",
  "https://res.cloudinary.com/diometfe9/image/upload/v1791809982/Sunlit_Mediterranean_Courtyard_Interior_ysf5d4.png",
];

const planterMedia = [
  "https://res.cloudinary.com/diometfe9/image/upload/v1791785002/60ce4371-9fe6-4b71-a2b6-f5405e06ee19_ipno40.png",
  "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/9f13fe9a-d57a-4409-8226-130fd93033f1_ahtdkz.png",
];

const deliveryPolicy = {
  codEnabled: true,
  codMinOrderPkr: 0,
  codMaxOrderPkr: null,
  estimatedDaysMin: 2,
  estimatedDaysMax: 7,
  flatFeePkr: 250,
  freeShippingThresholdPkr: 5000,
} as const;

const fixtures: Record<string, ProductDetailData> = {
  "test-aurelia-floor-lamp": {
    id: "11111111-1111-4111-8111-111111111111",
    productType: "lamp",
    name: "Aurelia Floor Lamp",
    slug: "test-aurelia-floor-lamp",
    shortDescription: "Layered evening light with a quiet architectural silhouette.",
    description:
      "Aurelia brings a warm pool of light to reading corners and living rooms. Its slender frame and linen shade are intentionally restrained so the atmosphere, rather than the fixture, becomes the focus.",
    materialSummary: "Powder-coated metal, linen shade",
    careInstructions:
      "Dust with a soft dry cloth. Disconnect from power before cleaning and avoid abrasive cleaners.",
    seoTitle: "Aurelia Floor Lamp | House of Lume",
    seoDescription: "A warm architectural floor lamp with considered finishes and linen shade.",
    specifications: {
      dimmable: true,
      bulb: "E27 LED",
      cable_length: "2.2 m",
      room: "Living room / reading corner",
    },
    publishedAt: "2026-10-13T00:00:00.000Z",
    primaryCategory: { name: "Lighting", slug: "lighting" },
    media: [
      {
        id: "11111111-1111-4111-8111-111111111201",
        variantId: null,
        mediaType: "image",
        url: lampMedia[0] ?? null,
        altText: "Aurelia floor lamp staged in warm evening light",
        width: 1200,
        height: 1500,
        position: 0,
        isPrimary: true,
      },
      {
        id: "11111111-1111-4111-8111-111111111202",
        variantId: null,
        mediaType: "image",
        url: lampMedia[1] ?? null,
        altText: "A warm House of Lume interior showing layered ambient light",
        width: 1600,
        height: 1200,
        position: 1,
        isPrimary: false,
      },
      {
        id: "11111111-1111-4111-8111-111111111203",
        variantId: "11111111-1111-4111-8111-111111111301",
        mediaType: "image",
        url: lampMedia[0] ?? null,
        altText: "Aurelia floor lamp in Warm Brass finish",
        width: 1200,
        height: 1500,
        position: 0,
        isPrimary: true,
      },
    ],
    options: [
      {
        id: "11111111-1111-4111-8111-111111111401",
        name: "Finish",
        slug: "finish",
        position: 10,
        values: [
          {
            id: "11111111-1111-4111-8111-111111111501",
            value: "Warm Brass",
            swatchHex: "#96744D",
            position: 10,
          },
          {
            id: "11111111-1111-4111-8111-111111111502",
            value: "Ink Black",
            swatchHex: "#1E1D1A",
            position: 20,
          },
        ],
      },
      {
        id: "11111111-1111-4111-8111-111111111402",
        name: "Size",
        slug: "size",
        position: 20,
        values: [
          {
            id: "11111111-1111-4111-8111-111111111503",
            value: "Medium",
            swatchHex: null,
            position: 10,
          },
          {
            id: "11111111-1111-4111-8111-111111111504",
            value: "Large",
            swatchHex: null,
            position: 20,
          },
        ],
      },
    ],
    variants: [
      {
        id: "11111111-1111-4111-8111-111111111301",
        sku: "TEST-AUR-BRASS-M",
        title: "Warm Brass / Medium",
        pricePkr: 18900,
        compareAtPricePkr: 20900,
        weightGrams: 4200,
        dimensionsCm: { height: 158, width: 42, depth: 62 },
        attributes: { finish: "Warm Brass", size: "Medium" },
        trackInventory: true,
        optionValueIds: [
          "11111111-1111-4111-8111-111111111501",
          "11111111-1111-4111-8111-111111111503",
        ],
        availableQuantity: 3,
        inStock: true,
        lowStock: true,
      },
      {
        id: "11111111-1111-4111-8111-111111111302",
        sku: "TEST-AUR-BLACK-L",
        title: "Ink Black / Large",
        pricePkr: 21900,
        compareAtPricePkr: null,
        weightGrams: 4900,
        dimensionsCm: { height: 172, width: 46, depth: 66 },
        attributes: { finish: "Ink Black", size: "Large" },
        trackInventory: true,
        optionValueIds: [
          "11111111-1111-4111-8111-111111111502",
          "11111111-1111-4111-8111-111111111504",
        ],
        availableQuantity: 0,
        inStock: false,
        lowStock: false,
      },
    ],
    reviewSummary: { count: 12, averageRating: 4.8 },
    deliveryPolicy,
  },
  "test-sable-planter": {
    id: "22222222-2222-4222-8222-222222222222",
    productType: "planter",
    name: "Sable Planter",
    slug: "test-sable-planter",
    shortDescription: "A grounded ceramic planter for sculptural indoor greenery.",
    description:
      "Sable pairs a softly textured ceramic body with a quiet, architectural profile designed to sit comfortably beside timber, stone and natural textiles.",
    materialSummary: "Glazed ceramic",
    careInstructions: "Wipe with a damp cloth. Use an inner nursery pot or saucer for live plants.",
    seoTitle: "Sable Planter | House of Lume",
    seoDescription: "A considered glazed ceramic planter for indoor greenery.",
    specifications: { drainage: "Inner drainage insert", use: "Indoor" },
    publishedAt: "2026-10-13T00:00:00.000Z",
    primaryCategory: { name: "Planters", slug: "planters" },
    media: [
      {
        id: "22222222-2222-4222-8222-222222222201",
        variantId: null,
        mediaType: "image",
        url: planterMedia[0] ?? null,
        altText: "Sable planter in a warm House of Lume interior",
        width: 1200,
        height: 1500,
        position: 0,
        isPrimary: true,
      },
      {
        id: "22222222-2222-4222-8222-222222222202",
        variantId: null,
        mediaType: "image",
        url: planterMedia[1] ?? null,
        altText: "Living greenery styled with a neutral ceramic planter",
        width: 1200,
        height: 1500,
        position: 1,
        isPrimary: false,
      },
    ],
    options: [
      {
        id: "22222222-2222-4222-8222-222222222401",
        name: "Size",
        slug: "size",
        position: 10,
        values: [
          {
            id: "22222222-2222-4222-8222-222222222501",
            value: "Medium",
            swatchHex: null,
            position: 10,
          },
        ],
      },
    ],
    variants: [
      {
        id: "22222222-2222-4222-8222-222222222301",
        sku: "TEST-SABLE-M",
        title: "Medium",
        pricePkr: 7400,
        compareAtPricePkr: null,
        weightGrams: 3100,
        dimensionsCm: { height: 38, diameter: 34 },
        attributes: { size: "Medium" },
        trackInventory: false,
        optionValueIds: ["22222222-2222-4222-8222-222222222501"],
        availableQuantity: null,
        inStock: true,
        lowStock: false,
      },
    ],
    reviewSummary: { count: 0, averageRating: null },
    deliveryPolicy,
  },
};

const related: Record<string, RelatedProductSummary[]> = {
  "test-aurelia-floor-lamp": [
    {
      id: fixtures["test-sable-planter"]!.id,
      name: fixtures["test-sable-planter"]!.name,
      slug: fixtures["test-sable-planter"]!.slug,
      productType: "planter",
      shortDescription: fixtures["test-sable-planter"]!.shortDescription,
      material: fixtures["test-sable-planter"]!.materialSummary,
      minPricePkr: 7400,
      maxPricePkr: 7400,
      inStock: true,
      mediaUrl: planterMedia[0] ?? null,
      mediaAlt: "Sable planter in a warm House of Lume interior",
    },
  ],
  "test-sable-planter": [
    {
      id: fixtures["test-aurelia-floor-lamp"]!.id,
      name: fixtures["test-aurelia-floor-lamp"]!.name,
      slug: fixtures["test-aurelia-floor-lamp"]!.slug,
      productType: "lamp",
      shortDescription: fixtures["test-aurelia-floor-lamp"]!.shortDescription,
      material: fixtures["test-aurelia-floor-lamp"]!.materialSummary,
      minPricePkr: 18900,
      maxPricePkr: 21900,
      inStock: true,
      mediaUrl: lampMedia[0] ?? null,
      mediaAlt: "Aurelia floor lamp staged in warm evening light",
    },
  ],
};

export function getProductDetailFixture(slug: string) {
  const product = fixtures[slug];
  return product ? { product, relatedProducts: related[slug] ?? [] } : null;
}
