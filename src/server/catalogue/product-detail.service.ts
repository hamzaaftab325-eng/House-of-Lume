import { cache } from "react";
import { z } from "zod";

import { env } from "@/lib/env";
import type {
  ProductDeliveryPolicy,
  ProductDetailData,
  ProductMediaItem,
  ProductOption,
  ProductVariant,
  RelatedProductSummary,
} from "@/lib/product-detail";
import { createClient } from "@/lib/supabase/server";

import { getProductDetailFixture } from "./product-detail.fixture";

const productRowSchema = z.object({
  id: z.string().uuid(),
  product_type: z.string(),
  name: z.string(),
  slug: z.string(),
  short_description: z.string().nullable(),
  description: z.string().nullable(),
  material_summary: z.string().nullable(),
  care_instructions: z.string().nullable(),
  seo_title: z.string().nullable(),
  seo_description: z.string().nullable(),
  specifications: z.record(z.string(), z.unknown()),
  published_at: z.string(),
});

const categoryRowSchema = z.object({
  is_primary: z.boolean(),
  categories: z
    .object({
      name: z.string(),
      slug: z.string(),
    })
    .nullable(),
});

const optionRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  position: z.number(),
  product_option_values: z
    .array(
      z.object({
        id: z.string().uuid(),
        value: z.string(),
        swatch_hex: z.string().nullable(),
        position: z.number(),
      }),
    )
    .default([]),
});

const variantRowSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  title: z.string(),
  price_pkr: z.number(),
  compare_at_price_pkr: z.number().nullable(),
  weight_grams: z.number().nullable(),
  dimensions_cm: z.record(z.string(), z.unknown()),
  attributes: z.record(z.string(), z.unknown()),
  track_inventory: z.boolean(),
  variant_option_values: z.array(z.object({ option_value_id: z.string().uuid() })).default([]),
});

const mediaRowSchema = z.object({
  id: z.string().uuid(),
  variant_id: z.string().uuid().nullable(),
  media_type: z.enum(["image", "video"]),
  storage_path: z.string(),
  alt_text: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  position: z.number(),
  is_primary: z.boolean(),
});

const stockRowSchema = z.object({
  variant_id: z.string().uuid(),
  available_quantity: z.number().nullable(),
  in_stock: z.boolean(),
  low_stock: z.boolean(),
});

const reviewRowSchema = z.object({ rating: z.number().int().min(1).max(5) });

const settingRowSchema = z.object({ key: z.string(), value: z.unknown() });

const shippingRuleRowSchema = z.object({
  flat_fee_pkr: z.number(),
  free_shipping_threshold_pkr: z.number().nullable(),
  cod_min_order_pkr: z.number(),
  cod_max_order_pkr: z.number().nullable(),
  estimated_days_min: z.number(),
  estimated_days_max: z.number(),
});

const relatedRowSchema = z.object({
  id: z.string().uuid(),
  product_type: z.string(),
  name: z.string(),
  slug: z.string(),
  short_description: z.string().nullable(),
  material_summary: z.string().nullable(),
  min_price_pkr: z.number().nullable(),
  max_price_pkr: z.number().nullable(),
  in_stock: z.boolean(),
  primary_media_path: z.string().nullable(),
  primary_media_alt: z.string().nullable(),
});

export type ProductDetailResult = {
  product: ProductDetailData;
  relatedProducts: RelatedProductSummary[];
};

const isCiPlaceholder = env.NEXT_PUBLIC_SUPABASE_URL === "https://example.supabase.co";
const trustedCloudinaryPrefix = "https://res.cloudinary.com/diometfe9/";

function databaseError(scope: string, message: string) {
  return new Error(`Product detail ${scope} failed: ${message}`);
}

function trustedMediaUrl(path: string | null) {
  return path?.startsWith(trustedCloudinaryPrefix) ? path : null;
}

function normalizeOptions(rows: z.infer<typeof optionRowSchema>[]): ProductOption[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    position: row.position,
    values: [...row.product_option_values]
      .sort((a, b) => a.position - b.position)
      .map((value) => ({
        id: value.id,
        value: value.value,
        swatchHex: value.swatch_hex,
        position: value.position,
      })),
  }));
}

function normalizeMedia(rows: z.infer<typeof mediaRowSchema>[]): ProductMediaItem[] {
  return rows.map((row) => ({
    id: row.id,
    variantId: row.variant_id,
    mediaType: row.media_type,
    url: trustedMediaUrl(row.storage_path),
    altText: row.alt_text,
    width: row.width,
    height: row.height,
    position: row.position,
    isPrimary: row.is_primary,
  }));
}

function normalizeVariants(
  rows: z.infer<typeof variantRowSchema>[],
  stockRows: z.infer<typeof stockRowSchema>[],
): ProductVariant[] {
  const stockByVariant = new Map(stockRows.map((row) => [row.variant_id, row]));

  return rows.map((row) => {
    const stock = stockByVariant.get(row.id);
    return {
      id: row.id,
      sku: row.sku,
      title: row.title,
      pricePkr: row.price_pkr,
      compareAtPricePkr: row.compare_at_price_pkr,
      weightGrams: row.weight_grams,
      dimensionsCm: row.dimensions_cm,
      attributes: row.attributes,
      trackInventory: row.track_inventory,
      optionValueIds: row.variant_option_values.map((item) => item.option_value_id),
      availableQuantity: stock?.available_quantity ?? (row.track_inventory ? 0 : null),
      inStock: stock?.in_stock ?? !row.track_inventory,
      lowStock: stock?.low_stock ?? false,
    };
  });
}

function reviewSummary(rows: z.infer<typeof reviewRowSchema>[]) {
  if (!rows.length) return { count: 0, averageRating: null };
  const average = rows.reduce((sum, row) => sum + row.rating, 0) / rows.length;
  return { count: rows.length, averageRating: Math.round(average * 10) / 10 };
}

function deliveryPolicy(
  settings: z.infer<typeof settingRowSchema>[],
  shippingRule: z.infer<typeof shippingRuleRowSchema> | null,
): ProductDeliveryPolicy {
  const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value]));
  const codEnabled = settingsMap.get("payments.cod_enabled") === true;

  return {
    codEnabled,
    codMinOrderPkr: shippingRule?.cod_min_order_pkr ?? 0,
    codMaxOrderPkr: shippingRule?.cod_max_order_pkr ?? null,
    estimatedDaysMin: shippingRule?.estimated_days_min ?? 2,
    estimatedDaysMax: shippingRule?.estimated_days_max ?? 7,
    flatFeePkr: shippingRule?.flat_fee_pkr ?? 0,
    freeShippingThresholdPkr: shippingRule?.free_shipping_threshold_pkr ?? null,
  };
}

function normalizeRelated(rows: unknown[], currentProductId: string): RelatedProductSummary[] {
  return z
    .array(relatedRowSchema)
    .parse(rows)
    .filter((row) => row.id !== currentProductId)
    .slice(0, 4)
    .map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      productType: row.product_type,
      shortDescription: row.short_description,
      material: row.material_summary,
      minPricePkr: row.min_price_pkr,
      maxPricePkr: row.max_price_pkr,
      inStock: row.in_stock,
      mediaUrl: trustedMediaUrl(row.primary_media_path),
      mediaAlt: row.primary_media_alt,
    }));
}

export const getProductDetail = cache(
  async (slug: string): Promise<ProductDetailResult | null> => {
    const cleanSlug = slug.trim().slice(0, 140);
    if (!cleanSlug) return null;
    if (isCiPlaceholder) return getProductDetailFixture(cleanSlug);

    const supabase = await createClient();
    const now = new Date().toISOString();
    const productResult = await supabase
      .from("products")
      .select(
        "id,product_type,name,slug,short_description,description,material_summary,care_instructions,seo_title,seo_description,specifications,published_at",
      )
      .eq("slug", cleanSlug)
      .eq("status", "active")
      .not("published_at", "is", null)
      .lte("published_at", now)
      .maybeSingle();

    if (productResult.error) throw databaseError("product", productResult.error.message);
    if (!productResult.data) return null;

    const productRow = productRowSchema.parse(productResult.data);

    const [
      categoriesResult,
      optionsResult,
      variantsResult,
      mediaResult,
      stockResult,
      reviewsResult,
      settingsResult,
      shippingResult,
    ] = await Promise.all([
      supabase
        .from("product_categories")
        .select("is_primary,categories(name,slug)")
        .eq("product_id", productRow.id),
      supabase
        .from("product_options")
        .select("id,name,slug,position,product_option_values(id,value,swatch_hex,position)")
        .eq("product_id", productRow.id)
        .order("position", { ascending: true }),
      supabase
        .from("product_variants")
        .select(
          "id,sku,title,price_pkr,compare_at_price_pkr,weight_grams,dimensions_cm,attributes,track_inventory,variant_option_values(option_value_id)",
        )
        .eq("product_id", productRow.id)
        .eq("status", "active")
        .order("created_at", { ascending: true }),
      supabase
        .from("product_media")
        .select("id,variant_id,media_type,storage_path,alt_text,width,height,position,is_primary")
        .eq("product_id", productRow.id)
        .order("is_primary", { ascending: false })
        .order("position", { ascending: true }),
      supabase
        .from("product_variant_stock_status")
        .select("variant_id,available_quantity,in_stock,low_stock")
        .eq("product_id", productRow.id),
      supabase.from("reviews").select("rating").eq("product_id", productRow.id).eq("status", "approved"),
      supabase
        .from("system_settings")
        .select("key,value")
        .eq("is_public", true)
        .in("key", ["payments.cod_enabled"]),
      supabase
        .from("shipping_rules")
        .select(
          "flat_fee_pkr,free_shipping_threshold_pkr,cod_min_order_pkr,cod_max_order_pkr,estimated_days_min,estimated_days_max",
        )
        .eq("is_active", true)
        .lte("starts_at", now)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    const failures = [
      ["categories", categoriesResult.error],
      ["options", optionsResult.error],
      ["variants", variantsResult.error],
      ["media", mediaResult.error],
      ["variant stock", stockResult.error],
      ["reviews", reviewsResult.error],
      ["settings", settingsResult.error],
      ["shipping", shippingResult.error],
    ] as const;
    const failure = failures.find(([, error]) => error);
    if (failure?.[1]) throw databaseError(failure[0], failure[1].message);

    const categories = z.array(categoryRowSchema).parse(categoriesResult.data ?? []);
    const options = normalizeOptions(z.array(optionRowSchema).parse(optionsResult.data ?? []));
    const variants = normalizeVariants(
      z.array(variantRowSchema).parse(variantsResult.data ?? []),
      z.array(stockRowSchema).parse(stockResult.data ?? []),
    );
    const media = normalizeMedia(z.array(mediaRowSchema).parse(mediaResult.data ?? []));
    const reviews = z.array(reviewRowSchema).parse(reviewsResult.data ?? []);
    const settings = z.array(settingRowSchema).parse(settingsResult.data ?? []);
    const shippingRule = shippingResult.data
      ? shippingRuleRowSchema.parse(shippingResult.data)
      : null;
    const primaryCategory = categories.find((category) => category.is_primary)?.categories ?? null;

    const relatedResult = await supabase.rpc("catalogue_products", {
      p_category: primaryCategory?.slug ?? null,
      p_sort: "featured",
      p_limit: 6,
      p_offset: 0,
    });
    if (relatedResult.error) throw databaseError("related products", relatedResult.error.message);

    return {
      product: {
        id: productRow.id,
        productType: productRow.product_type,
        name: productRow.name,
        slug: productRow.slug,
        shortDescription: productRow.short_description,
        description: productRow.description,
        materialSummary: productRow.material_summary,
        careInstructions: productRow.care_instructions,
        seoTitle: productRow.seo_title,
        seoDescription: productRow.seo_description,
        specifications: productRow.specifications,
        publishedAt: productRow.published_at,
        primaryCategory,
        media,
        options,
        variants,
        reviewSummary: reviewSummary(reviews),
        deliveryPolicy: deliveryPolicy(settings, shippingRule),
      },
      relatedProducts: normalizeRelated(relatedResult.data ?? [], productRow.id),
    };
  },
);
