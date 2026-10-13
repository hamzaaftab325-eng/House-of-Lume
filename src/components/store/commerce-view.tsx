"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Heart, Minus, PackageOpen, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useStoreCommerce } from "@/components/providers/store-commerce";
import { IconButton, DwelluneButton, DwelluneButtonLink } from "@/components/ui/controls";
import { useToast } from "@/components/ui/toast";
import { mediaUrl, type CartLine, type SavedLine } from "@/lib/commerce";
import { formatPkr } from "@/lib/product-detail";
import styles from "./commerce-view.module.css";

function ProductIdentity({ line, onNavigate }: { line: SavedLine; onNavigate?: () => void }) {
  const src = mediaUrl(line.media_path);
  return (
    <Link
      href={`/products/${line.product_slug}`}
      className={styles.productLink}
      onClick={onNavigate}
    >
      <span className={styles.thumb}>
        {src ? (
          <Image src={src} alt="" fill sizes="(max-width: 480px) 72px, 112px" />
        ) : (
          <PackageOpen aria-hidden="true" />
        )}
      </span>
      <span className={styles.copy}>
        <strong>{line.product_name}</strong>
        <span>{line.variant_title}</span>
        <b>{formatPkr(line.unit_price_pkr)}</b>
      </span>
    </Link>
  );
}
function CommerceStatus() {
  const commerce = useStoreCommerce();
  return (
    <>
      {commerce.loading ? (
        <p className={styles.notice} role="status">
          Loading your selection…
        </p>
      ) : null}
      {commerce.error ? (
        <div className={styles.error} role="alert">
          <p>{commerce.error}</p>
          <DwelluneButton
            variant="quiet"
            disabled={commerce.pending}
            onClick={() => {
              void commerce.refresh().catch(() => undefined);
            }}
          >
            Retry
          </DwelluneButton>
        </div>
      ) : null}
      <span className={styles.srOnly} role="status" aria-live="polite">
        {commerce.pending ? "Updating your selection…" : ""}
      </span>
    </>
  );
}
function EmptySelection({ wishlist = false }: { wishlist?: boolean }) {
  return (
    <div className={styles.empty}>
      {wishlist ? <Heart aria-hidden="true" /> : <ShoppingBag aria-hidden="true" />}
      <h2>{wishlist ? "Nothing saved yet." : "Your bag is quiet."}</h2>
      <p>
        {wishlist
          ? "Save a finish or size you love and return to it whenever you are ready."
          : "Find an object that belongs in your home. Your selection will be saved for your next visit."}
      </p>
      <DwelluneButtonLink href="/shop" variant="frame" showArrow>
        Explore the collection
      </DwelluneButtonLink>
    </div>
  );
}
export function CartContents({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const commerce = useStoreCommerce();
  const toast = useToast();
  const [removed, setRemoved] = useState<CartLine | null>(null);
  const run = async (operation: () => Promise<void>) => {
    try {
      await operation();
    } catch (error) {
      toast.pushToast({
        title: "Bag not updated",
        message: error instanceof Error ? error.message : "Please retry.",
        tone: "error",
      });
    }
  };
  const cart = commerce.data?.cart;
  return (
    <div className={styles.contents} data-compact={compact}>
      <CommerceStatus />
      {removed ? (
        <div className={styles.undo} role="status">
          <span>{removed.product_name} removed.</span>
          <DwelluneButton
            variant="quiet"
            disabled={commerce.pending}
            onClick={() => {
              void run(async () => {
                await commerce.setQuantity(removed.variant_id, removed.quantity);
                setRemoved(null);
              });
            }}
          >
            Undo
          </DwelluneButton>
          <DwelluneButton variant="quiet" onClick={() => setRemoved(null)}>
            Dismiss
          </DwelluneButton>
        </div>
      ) : null}
      {cart?.lines.length ? (
        <div className={styles.list}>
          {cart.lines.map((line) => (
            <article className={styles.line} key={line.variant_id}>
              <ProductIdentity line={line} onNavigate={onNavigate} />
              <div className={styles.lineControls}>
                <div className={styles.quantity} aria-label={`Quantity for ${line.product_name}`}>
                  <IconButton
                    label={`Decrease ${line.product_name} quantity`}
                    icon={<Minus />}
                    disabled={commerce.pending || line.quantity <= 1}
                    onClick={() => {
                      void run(() => commerce.setQuantity(line.variant_id, line.quantity - 1));
                    }}
                  />
                  <output aria-label={`${line.product_name} quantity`}>Qty {line.quantity}</output>
                  <IconButton
                    label={`Increase ${line.product_name} quantity`}
                    icon={<Plus />}
                    disabled={commerce.pending || line.quantity >= line.max_quantity}
                    onClick={() => {
                      void run(() => commerce.setQuantity(line.variant_id, line.quantity + 1));
                    }}
                  />
                </div>
                <strong className={styles.linePrice}>{formatPkr(line.line_total_pkr)}</strong>
                <IconButton
                  label={`Remove ${line.product_name} from bag`}
                  icon={<Trash2 />}
                  disabled={commerce.pending}
                  onClick={() => {
                    void run(async () => {
                      await commerce.setQuantity(line.variant_id, 0);
                      setRemoved(line);
                    });
                  }}
                />
              </div>
              <p className={styles.stock} data-stock={line.stock_state}>
                {line.stock_state === "reserved"
                  ? `${line.reserved_quantity} reserved for your bag · up to ${cart.reservation_minutes} minutes`
                  : line.stock_state === "available"
                    ? "Available to order"
                    : line.stock_state === "unavailable"
                      ? "Insufficient stock. Reduce the quantity or remove this selection."
                      : "Reservation expired. Update the quantity to check stock again."}
              </p>
            </article>
          ))}
        </div>
      ) : !commerce.loading && !commerce.error ? (
        <EmptySelection />
      ) : null}
    </div>
  );
}
export function CartSummary() {
  const commerce = useStoreCommerce();
  const [code, setCode] = useState("");
  const quote = commerce.data?.cart.quote;
  if (!quote || !commerce.data?.cart.lines.length) return null;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await commerce.applyDiscount(code);
      setCode("");
    } catch {
      /* Shared live error retains the entered code. */
    }
  };
  return (
    <aside className={styles.summary} aria-label="Bag summary">
      <p className={styles.eyebrow}>Your selection, considered</p>
      <h2>Bag summary</h2>
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{formatPkr(quote.subtotal_pkr)}</dd>
        </div>
        {quote.discount_pkr > 0 ? (
          <div>
            <dt>Discount</dt>
            <dd>−{formatPkr(quote.discount_pkr)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Estimated delivery</dt>
          <dd>{quote.shipping_pkr === 0 ? "Complimentary" : formatPkr(quote.shipping_pkr)}</dd>
        </div>
        <div className={styles.total}>
          <dt>Estimated total</dt>
          <dd>{formatPkr(quote.total_pkr)}</dd>
        </div>
      </dl>
      {quote.discount_code ? (
        <div className={styles.applied}>
          <span>
            {quote.discount_code}
            {quote.discount_error ? ` · ${quote.discount_error}` : " applied"}
          </span>
          <DwelluneButton
            variant="quiet"
            disabled={commerce.pending}
            onClick={() => {
              void commerce.applyDiscount("").catch(() => undefined);
            }}
          >
            Remove code
          </DwelluneButton>
        </div>
      ) : null}
      <form className={styles.discount} onSubmit={submit}>
        <label htmlFor="bag-discount">Discount code</label>
        <div>
          <input
            id="bag-discount"
            name="discount"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength={80}
            autoComplete="off"
            disabled={commerce.pending}
          />
          <DwelluneButton type="submit" variant="frame" disabled={commerce.pending || !code.trim()}>
            Apply
          </DwelluneButton>
        </div>
      </form>
      <p className={styles.delivery}>
        Estimated arrival: {quote.estimated_days_min}–{quote.estimated_days_max} days. Delivery
        charges and eligibility are confirmed with your address.
      </p>
      {quote.free_shipping_threshold_pkr !== null &&
      quote.subtotal_pkr - quote.discount_pkr < quote.free_shipping_threshold_pkr ? (
        <p className={styles.delivery}>
          Complimentary delivery from {formatPkr(quote.free_shipping_threshold_pkr)}.
        </p>
      ) : null}
      <div className={styles.trust}>
        <strong>
          {quote.cod_eligible
            ? "Pay when your order arrives"
            : "This selection is outside the current COD limits"}
        </strong>
        <p>Cash on Delivery. No online payment is collected.</p>
      </div>
      <DwelluneButton className={styles.checkout} disabled>
        Ordering opens soon
      </DwelluneButton>
      <p className={styles.delivery}>Your bag is saved. Order placement is not available yet.</p>
      <DwelluneButtonLink href="/shop" variant="quiet" showArrow>
        Continue exploring
      </DwelluneButtonLink>
    </aside>
  );
}
export function WishlistContents({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const commerce = useStoreCommerce();
  const toast = useToast();
  const run = async (operation: () => Promise<void>) => {
    try {
      await operation();
    } catch (error) {
      toast.pushToast({
        title: "Selection not updated",
        message: error instanceof Error ? error.message : "Please retry.",
        tone: "error",
      });
    }
  };
  return (
    <div className={styles.contents} data-compact={compact}>
      <CommerceStatus />
      {!commerce.loading ? (
        <p className={styles.notice}>
          {commerce.data?.cart.authenticated
            ? "Saved to your account, ready on any device."
            : "Saved on this device. Your saved objects merge into your account when you sign in."}
        </p>
      ) : null}
      {commerce.wishlist.length ? (
        <div className={styles.list}>
          {commerce.wishlist.map((line) => (
            <article className={styles.line} key={line.variant_id}>
              <ProductIdentity line={line} onNavigate={onNavigate} />
              <div className={styles.savedControls}>
                <DwelluneButton
                  variant="frame"
                  disabled={commerce.pending || line.max_quantity === 0}
                  onClick={() => {
                    void run(() => commerce.moveToBag(line.variant_id));
                  }}
                >
                  {line.max_quantity === 0 ? "Out of stock" : "Move to bag"}
                </DwelluneButton>
                <IconButton
                  label={`Remove ${line.product_name} from wishlist`}
                  icon={<Trash2 />}
                  disabled={commerce.pending}
                  onClick={() => {
                    void run(() => commerce.removeFromWishlist(line.variant_id));
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      ) : !commerce.loading && !commerce.error ? (
        <EmptySelection wishlist />
      ) : null}
    </div>
  );
}
export function CommercePage({ wishlist = false }: { wishlist?: boolean }) {
  const commerce = useStoreCommerce();
  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>DWELLUNE · {wishlist ? "Saved objects" : "Your selection"}</p>
        <h1>{wishlist ? "Objects to return to." : "A place for your favourites."}</h1>
        <p>
          {wishlist
            ? "Keep a little inspiration close. Move an object to your bag when it feels right."
            : "Refine your selection. Prices and availability are checked as you make changes."}
        </p>
        <nav aria-label="Your selections">
          <Link href="/cart" aria-current={!wishlist ? "page" : undefined}>
            Shopping bag ({commerce.bagCount})
          </Link>
          <Link href="/wishlist" aria-current={wishlist ? "page" : undefined}>
            Wishlist ({commerce.wishlistCount})
          </Link>
        </nav>
      </header>
      <div className={styles.pageGrid} data-wishlist={wishlist}>
        {wishlist ? (
          <WishlistContents />
        ) : (
          <>
            <CartContents />
            <CartSummary />
          </>
        )}
      </div>
    </main>
  );
}
