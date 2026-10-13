"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Heart, PackageOpen, ShoppingBag, Trash2 } from "lucide-react";

import { useStoreCommerce } from "@/components/providers/store-commerce";
import { IconButton } from "@/components/ui/controls";
import { Drawer } from "@/components/ui/overlays";
import { formatPkr } from "@/lib/product-detail";

import styles from "./commerce-drawers.module.css";

type CommerceDrawersProps = {
  bagOpen: boolean;
  onBagOpenChange: (open: boolean) => void;
  wishlistOpen: boolean;
  onWishlistOpenChange: (open: boolean) => void;
};

function ProductThumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className={styles.thumb}>
      {src ? (
        <Image alt={alt} fill sizes="80px" src={src} />
      ) : (
        <PackageOpen aria-hidden="true" />
      )}
    </div>
  );
}

export function CommerceDrawers({
  bagOpen,
  onBagOpenChange,
  wishlistOpen,
  onWishlistOpenChange,
}: CommerceDrawersProps) {
  const commerce = useStoreCommerce();
  const bagSubtotal = commerce.bag.reduce(
    (sum, line) => sum + line.displayPricePkr * line.quantity,
    0,
  );

  return (
    <>
      <Drawer
        open={wishlistOpen}
        onOpenChange={onWishlistOpenChange}
        eyebrow="Saved objects"
        title="Wishlist"
        description="Saved on this device while customer-account syncing is prepared."
      >
        {commerce.wishlist.length ? (
          <div className={styles.list}>
            {commerce.wishlist.map((line) => (
              <article className={styles.line} key={line.variantId}>
                <Link
                  className={styles.productLink}
                  href={`/products/${line.productSlug}` as Route}
                  onClick={() => onWishlistOpenChange(false)}
                >
                  <ProductThumb src={line.mediaUrl} alt="" />
                  <span className={styles.copy}>
                    <strong>{line.productName}</strong>
                    <span>{line.variantTitle}</span>
                    <b>{formatPkr(line.displayPricePkr)}</b>
                  </span>
                </Link>
                <IconButton
                  className={styles.remove}
                  label={`Remove ${line.productName} from wishlist`}
                  icon={<Trash2 />}
                  onClick={() => commerce.removeFromWishlist(line.variantId)}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <Heart aria-hidden="true" />
            <strong>Nothing saved yet.</strong>
            <p>Save a finish or size from any product page and it will appear here.</p>
          </div>
        )}
      </Drawer>

      <Drawer
        open={bagOpen}
        onOpenChange={onBagOpenChange}
        eyebrow="Your selection"
        title="Shopping bag"
        description="A device-local selection for product discovery. Full cart management follows in the cart phase."
        footer={
          commerce.bag.length ? (
            <div className={styles.summary}>
              <span>Display subtotal</span>
              <strong>{formatPkr(bagSubtotal)}</strong>
              <p>Price and stock are revalidated server-side before checkout. Cash on Delivery only.</p>
            </div>
          ) : undefined
        }
      >
        {commerce.bag.length ? (
          <div className={styles.list}>
            {commerce.bag.map((line) => (
              <article className={styles.line} key={line.variantId}>
                <Link
                  className={styles.productLink}
                  href={`/products/${line.productSlug}` as Route}
                  onClick={() => onBagOpenChange(false)}
                >
                  <ProductThumb src={line.mediaUrl} alt="" />
                  <span className={styles.copy}>
                    <strong>{line.productName}</strong>
                    <span>{line.variantTitle}</span>
                    <span>Qty {line.quantity}</span>
                    <b>{formatPkr(line.displayPricePkr * line.quantity)}</b>
                  </span>
                </Link>
                <IconButton
                  className={styles.remove}
                  label={`Remove ${line.productName} from bag`}
                  icon={<Trash2 />}
                  onClick={() => commerce.removeFromBag(line.variantId)}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <ShoppingBag aria-hidden="true" />
            <strong>Your bag is quiet.</strong>
            <p>Choose an available product variant to start a considered selection.</p>
          </div>
        )}
      </Drawer>
    </>
  );
}
