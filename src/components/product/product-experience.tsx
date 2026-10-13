"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useStoreCommerce } from "@/components/providers/store-commerce";
import { useToast } from "@/components/ui/toast";
import {
  initialVariant,
  mediaForVariant,
  normalizeQuantity,
  variantForSelectionChange,
  variantQuantityLimit,
  type ProductDetailData,
} from "@/lib/product-detail";

import { ProductGallery } from "./product-gallery";
import { ProductPurchasePanel } from "./product-purchase-panel";
import styles from "./product-detail.module.css";

type ProductExperienceProps = {
  product: ProductDetailData;
  requestedSku?: string;
};

export function ProductExperience({ product, requestedSku }: ProductExperienceProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const commerce = useStoreCommerce();
  const [variant, setVariant] = useState(() => initialVariant(product.variants, requestedSku));
  const [quantity, setQuantity] = useState(() => (variant?.inStock ? 1 : 0));

  const media = variant ? mediaForVariant(product.media, variant.id) : product.media;
  const primaryMedia = media.find((item) => item.mediaType === "image" && item.url)?.url ?? null;
  const wishlisted = variant ? commerce.isWishlisted(variant.id) : false;

  const selectVariant = (nextVariant: NonNullable<typeof variant>) => {
    setVariant(nextVariant);
    setQuantity(nextVariant.inStock ? 1 : 0);
    router.replace(`${pathname}?variant=${encodeURIComponent(nextVariant.sku)}` as Route, {
      scroll: false,
    });
  };

  const onOptionChange = (optionSlug: string, valueId: string) => {
    if (!variant) return;
    selectVariant(
      variantForSelectionChange(product.variants, product.options, variant, optionSlug, valueId),
    );
  };

  const onAddToBag = () => {
    if (!variant?.inStock || quantity < 1) return;
    commerce.addToBag(
      {
        variantId: variant.id,
        productSlug: product.slug,
        productName: product.name,
        variantTitle: variant.title,
        displayPricePkr: variant.pricePkr,
        mediaUrl: primaryMedia,
      },
      quantity,
      variantQuantityLimit(variant),
    );
    toast.pushToast({
      title: "Added to your bag",
      message: `${product.name} · ${variant.title} · Qty ${quantity}`,
      tone: "success",
    });
  };

  const onToggleWishlist = () => {
    if (!variant) return;
    const saved = commerce.toggleWishlist({
      variantId: variant.id,
      productSlug: product.slug,
      productName: product.name,
      variantTitle: variant.title,
      displayPricePkr: variant.pricePkr,
      mediaUrl: primaryMedia,
    });
    toast.pushToast({
      title: saved ? "Saved for later" : "Removed from saved objects",
      message: `${product.name} · ${variant.title}`,
      tone: "info",
    });
  };

  return (
    <div className={styles.experience}>
      <ProductGallery key={variant?.id ?? "product-media"} media={media} productName={product.name} />
      <ProductPurchasePanel
        product={product}
        variant={variant}
        quantity={quantity}
        wishlisted={wishlisted}
        onOptionChange={onOptionChange}
        onQuantityChange={(next) => {
          if (!variant) return;
          setQuantity(normalizeQuantity(next, variant));
        }}
        onAddToBag={onAddToBag}
        onToggleWishlist={onToggleWishlist}
      />
    </div>
  );
}
