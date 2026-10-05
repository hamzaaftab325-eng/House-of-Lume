import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { env } from "@/lib/env";
import { logger } from "@/server/logger";

export type HomepageProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  productType: Database["public"]["Enums"]["product_type"];
  priceLabel: string;
};

function formatPkr(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function getHomepageProducts(limit = 4): Promise<HomepageProduct[]> {
  const supabase = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,slug,short_description,product_type,product_variants(price_pkr,status)",
    )
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("homepage.catalog_query_failed", {
      code: error.code,
      message: error.message,
    });
    return [];
  }

  return (data ?? []).map((product) => {
    const prices = (product.product_variants ?? [])
      .filter((variant) => variant.status === "active")
      .map((variant) => Number(variant.price_pkr))
      .filter((price) => Number.isFinite(price) && price >= 0);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.short_description ?? "Considered for warm, lived-in spaces.",
      productType: product.product_type,
      priceLabel: lowestPrice === null ? "Price on request" : formatPkr(lowestPrice),
    };
  });
}
