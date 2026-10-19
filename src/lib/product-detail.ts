export type ProductMediaItem = {
  id: string;
  variantId: string | null;
  mediaType: "image" | "video";
  url: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
  position: number;
  isPrimary: boolean;
};

type ProductOptionValue = {
  id: string;
  value: string;
  swatchHex: string | null;
  position: number;
};

export type ProductOption = {
  id: string;
  name: string;
  slug: string;
  position: number;
  values: ProductOptionValue[];
};

export type ProductVariant = {
  id: string;
  sku: string;
  title: string;
  pricePkr: number;
  compareAtPricePkr: number | null;
  weightGrams: number | null;
  dimensionsCm: Record<string, unknown>;
  attributes: Record<string, unknown>;
  trackInventory: boolean;
  optionValueIds: string[];
  availableQuantity: number | null;
  inStock: boolean;
  lowStock: boolean;
};

export type ProductDeliveryPolicy = {
  codEnabled: boolean;
  codMinOrderPkr: number;
  codMaxOrderPkr: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  flatFeePkr: number;
  freeShippingThresholdPkr: number | null;
};

export type ProductDetailData = {
  id: string;
  productType: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  materialSummary: string | null;
  careInstructions: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  specifications: Record<string, unknown>;
  publishedAt: string;
  primaryCategory: { name: string; slug: string } | null;
  media: ProductMediaItem[];
  options: ProductOption[];
  variants: ProductVariant[];
  deliveryPolicy: ProductDeliveryPolicy;
};

export type RelatedProductSummary = {
  id: string;
  name: string;
  slug: string;
  productType: string;
  shortDescription: string | null;
  material: string | null;
  minPricePkr: number | null;
  maxPricePkr: number | null;
  inStock: boolean;
  mediaUrl: string | null;
  mediaAlt: string | null;
};

const MAX_BAG_QUANTITY = 99;

const pkr = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

export function formatPkr(value: number) {
  return pkr.format(value);
}

export function variantQuantityLimit(variant: ProductVariant) {
  if (!variant.inStock) return 0;
  if (!variant.trackInventory || variant.availableQuantity === null) return MAX_BAG_QUANTITY;
  return Math.max(0, Math.min(MAX_BAG_QUANTITY, variant.availableQuantity));
}

export function normalizeQuantity(value: number, variant: ProductVariant) {
  const limit = variantQuantityLimit(variant);
  if (limit === 0) return 0;
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(limit, Math.round(value)));
}

export function initialVariant(variants: ProductVariant[], requestedSku?: string) {
  if (!variants.length) return null;
  if (requestedSku) {
    const requested = variants.find(
      (variant) => variant.sku.toLowerCase() === requestedSku.toLowerCase(),
    );
    if (requested) return requested;
  }
  return variants.find((variant) => variant.inStock) ?? variants[0] ?? null;
}

export function selectionMapForVariant(variant: ProductVariant, options: ProductOption[]) {
  const selected = new Set(variant.optionValueIds);
  return Object.fromEntries(
    options.map((option) => [
      option.slug,
      option.values.find((value) => selected.has(value.id))?.id ?? "",
    ]),
  );
}

export function variantForSelectionChange(
  variants: ProductVariant[],
  options: ProductOption[],
  current: ProductVariant,
  optionSlug: string,
  valueId: string,
) {
  const selections = selectionMapForVariant(current, options);
  selections[optionSlug] = valueId;
  const selectedValueIds = Object.values(selections).filter(Boolean);

  const exact = variants.find((variant) =>
    selectedValueIds.every((selectedId) => variant.optionValueIds.includes(selectedId)),
  );
  if (exact) return exact;

  return variants.find((variant) => variant.optionValueIds.includes(valueId)) ?? current;
}

export function mediaForVariant(media: ProductMediaItem[], variantId: string) {
  const variantMedia = media.filter((item) => item.variantId === variantId);
  const sharedMedia = media.filter((item) => item.variantId === null);
  const ordered = [...variantMedia, ...sharedMedia];
  return ordered.length ? ordered : media;
}

export function isCodEligible(
  variantPricePkr: number,
  quantity: number,
  policy: ProductDeliveryPolicy,
) {
  if (!policy.codEnabled || quantity <= 0) return false;
  const subtotal = variantPricePkr * quantity;
  if (subtotal < policy.codMinOrderPkr) return false;
  return policy.codMaxOrderPkr === null || subtotal <= policy.codMaxOrderPkr;
}

export function variantStockLabel(variant: ProductVariant) {
  if (!variant.inStock) return "Currently unavailable";
  if (variant.lowStock) return "Low stock";
  return "In stock";
}
