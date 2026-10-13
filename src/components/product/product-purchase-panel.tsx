"use client";

import { Heart, Minus, Plus, Star } from "lucide-react";

import { DwelluneButton } from "@/components/ui/controls";
import {
  formatPkr,
  isCodEligible,
  selectionMapForVariant,
  variantQuantityLimit,
  variantStockLabel,
  type ProductDetailData,
  type ProductVariant,
} from "@/lib/product-detail";

import styles from "./product-detail.module.css";

type ProductPurchasePanelProps = {
  product: ProductDetailData;
  variant: ProductVariant | null;
  quantity: number;
  wishlisted: boolean;
  pending: boolean;
  onOptionChange: (optionSlug: string, valueId: string) => void;
  onQuantityChange: (quantity: number) => void;
  onAddToBag: () => void;
  onToggleWishlist: () => void;
};

function dimensionText(dimensions: Record<string, unknown>) {
  const entries = Object.entries(dimensions).filter(
    (entry): entry is [string, string | number] =>
      typeof entry[1] === "string" || typeof entry[1] === "number",
  );
  if (!entries.length) return null;
  return entries.map(([key, value]) => `${key.replaceAll("_", " ")} ${value} cm`).join(" · ");
}

export function ProductPurchasePanel({
  product,
  variant,
  quantity,
  wishlisted,
  pending,
  onOptionChange,
  onQuantityChange,
  onAddToBag,
  onToggleWishlist,
}: ProductPurchasePanelProps) {
  const selected = variant ? selectionMapForVariant(variant, product.options) : {};
  const quantityLimit = variant ? variantQuantityLimit(variant) : 0;
  const codEligible = variant
    ? isCodEligible(variant.pricePkr, quantity, product.deliveryPolicy)
    : false;
  const dimensions = variant ? dimensionText(variant.dimensionsCm) : null;

  return (
    <aside className={styles.purchasePanel} aria-label="Product purchase options">
      <div className={styles.purchaseHeader}>
        <p className={styles.productType}>{product.productType.replaceAll("_", " ")}</p>
        <h1>{product.name}</h1>
        {product.shortDescription ? (
          <p className={styles.descriptor}>{product.shortDescription}</p>
        ) : null}
      </div>

      {variant ? (
        <div className={styles.priceRow} aria-live="polite">
          <strong>{formatPkr(variant.pricePkr)}</strong>
          {variant.compareAtPricePkr ? <del>{formatPkr(variant.compareAtPricePkr)}</del> : null}
        </div>
      ) : (
        <p className={styles.unavailableCopy}>No purchasable variant is currently published.</p>
      )}

      <div className={styles.reviewSummary}>
        <Star aria-hidden="true" />
        {product.reviewSummary.count > 0 && product.reviewSummary.averageRating ? (
          <span>
            <strong>{product.reviewSummary.averageRating.toFixed(1)}</strong> from{" "}
            {product.reviewSummary.count} {product.reviewSummary.count === 1 ? "review" : "reviews"}
          </span>
        ) : (
          <span>No reviews yet</span>
        )}
      </div>

      {product.options.map((option) => (
        <fieldset className={styles.optionGroup} key={option.id}>
          <legend>{option.name}</legend>
          <div className={styles.optionValues}>
            {option.values.map((value) => {
              const isSelected = selected[option.slug] === value.id;
              const hasStockedVariant = product.variants.some(
                (candidate) => candidate.optionValueIds.includes(value.id) && candidate.inStock,
              );
              return (
                <button
                  aria-pressed={isSelected}
                  className={styles.optionButton}
                  data-available={hasStockedVariant}
                  key={value.id}
                  onClick={() => onOptionChange(option.slug, value.id)}
                  type="button"
                >
                  {value.swatchHex ? (
                    <svg className={styles.swatch} viewBox="0 0 16 16" aria-hidden="true">
                      <circle cx="8" cy="8" r="7" fill={value.swatchHex} />
                    </svg>
                  ) : null}
                  <span>{value.value}</span>
                  {!hasStockedVariant ? <small>Unavailable</small> : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      {variant ? (
        <div className={styles.variantFacts} aria-live="polite">
          <div>
            <span>Availability</span>
            <strong data-stock={variant.inStock ? (variant.lowStock ? "low" : "in") : "out"}>
              {variantStockLabel(variant)}
            </strong>
          </div>
          <div>
            <span>SKU</span>
            <strong>{variant.sku}</strong>
          </div>
          {dimensions ? (
            <div>
              <span>Dimensions</span>
              <strong>{dimensions}</strong>
            </div>
          ) : null}
          {variant.weightGrams ? (
            <div>
              <span>Weight</span>
              <strong>{(variant.weightGrams / 1000).toFixed(1)} kg</strong>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={styles.quantityBlock}>
        <span className={styles.controlLabel}>Quantity</span>
        <div className={styles.quantityControl}>
          <button
            aria-label="Decrease quantity"
            disabled={!variant?.inStock || quantity <= 1}
            onClick={() => onQuantityChange(quantity - 1)}
            type="button"
          >
            <Minus aria-hidden="true" />
          </button>
          <output aria-live="polite" aria-label={`Quantity ${quantity}`}>
            {quantity}
          </output>
          <button
            aria-label="Increase quantity"
            disabled={!variant?.inStock || quantity >= quantityLimit}
            onClick={() => onQuantityChange(quantity + 1)}
            type="button"
          >
            <Plus aria-hidden="true" />
          </button>
        </div>
        {variant?.trackInventory && variant.availableQuantity !== null && variant.inStock ? (
          <small>{variant.availableQuantity} available</small>
        ) : null}
      </div>

      <div className={styles.purchaseActions}>
        <DwelluneButton
          className={styles.addButton}
          disabled={pending || !variant?.inStock || quantity < 1}
          onClick={onAddToBag}
          showArrow
        >
          {variant?.inStock ? "Add to Bag" : "Currently unavailable"}
        </DwelluneButton>
        <button
          aria-pressed={wishlisted}
          className={styles.wishlistButton}
          disabled={pending || !variant}
          onClick={onToggleWishlist}
          type="button"
        >
          <Heart aria-hidden="true" fill={wishlisted ? "currentColor" : "none"} />
          <span>{wishlisted ? "Saved" : "Save"}</span>
        </button>
      </div>

      <div className={styles.commerceAssurance}>
        <div>
          <strong>
            {codEligible
              ? "Pay when your order arrives"
              : "COD eligibility depends on this selection"}
          </strong>
          <p>
            {product.deliveryPolicy.codEnabled
              ? "Cash on Delivery is the launch payment method. No online payment is collected here."
              : "Cash on Delivery is temporarily unavailable for this product selection."}
          </p>
        </div>
        <div>
          <strong>
            Estimated delivery: {product.deliveryPolicy.estimatedDaysMin}–
            {product.deliveryPolicy.estimatedDaysMax} days
          </strong>
          <p>
            {product.deliveryPolicy.freeShippingThresholdPkr
              ? `Standard delivery is ${formatPkr(product.deliveryPolicy.flatFeePkr)}; free from ${formatPkr(product.deliveryPolicy.freeShippingThresholdPkr)}.`
              : `Standard delivery is ${formatPkr(product.deliveryPolicy.flatFeePkr)}.`}
          </p>
        </div>
        <div>
          <strong>Returns & support</strong>
          <p>
            Return eligibility is confirmed against the item and order condition. Support
            instructions are provided with your order.
          </p>
        </div>
      </div>
    </aside>
  );
}
