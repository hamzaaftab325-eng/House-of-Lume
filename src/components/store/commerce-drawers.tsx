"use client";
import { useStoreCommerce } from "@/components/providers/store-commerce";
import { LumeButtonLink } from "@/components/ui/controls";
import { Drawer } from "@/components/ui/overlays";
import { formatPkr } from "@/lib/product-detail";
import { CartContents, WishlistContents } from "./commerce-view";
type Props = {
  bagOpen: boolean;
  onBagOpenChange: (open: boolean) => void;
  wishlistOpen: boolean;
  onWishlistOpenChange: (open: boolean) => void;
};
export function CommerceDrawers({
  bagOpen,
  onBagOpenChange,
  wishlistOpen,
  onWishlistOpenChange,
}: Props) {
  const commerce = useStoreCommerce();
  return (
    <>
      <Drawer
        open={wishlistOpen}
        onOpenChange={onWishlistOpenChange}
        eyebrow="Saved objects"
        title="Wishlist"
        footer={
          <LumeButtonLink href="/wishlist" showArrow onClick={() => onWishlistOpenChange(false)}>
            View saved objects
          </LumeButtonLink>
        }
      >
        <WishlistContents compact onNavigate={() => onWishlistOpenChange(false)} />
      </Drawer>
      <Drawer
        open={bagOpen}
        onOpenChange={onBagOpenChange}
        eyebrow="Your selection"
        title="Shopping bag"
        footer={
          <>
            <p>
              Subtotal <strong>{formatPkr(commerce.data?.cart.quote.subtotal_pkr ?? 0)}</strong>
            </p>
            <LumeButtonLink href="/cart" showArrow onClick={() => onBagOpenChange(false)}>
              Review your bag
            </LumeButtonLink>
          </>
        }
      >
        <CartContents compact onNavigate={() => onBagOpenChange(false)} />
      </Drawer>
    </>
  );
}
