"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useStoreCommerce } from "@/components/providers/store-commerce";
import { DwelluneButton, DwelluneButtonLink } from "@/components/ui/controls";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/ui/forms";
import {
  checkoutContextSchema,
  placeOrderSchema,
  orderConfirmationSchema,
  type PlaceOrderInput,
  checkoutQuoteSchema,
  provinces,
  type CheckoutContext,
  type CheckoutQuote,
} from "@/lib/checkout";
import { formatPkr } from "@/lib/product-detail";
import type { Cart } from "@/lib/commerce";
import styles from "./checkout.module.css";

const empty = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  province: "Punjab",
  postalCode: "",
  notes: "",
  terms: false,
  savedAddressId: "",
};
type Values = typeof empty;
export function CheckoutPage() {
  const commerce = useStoreCommerce();
  const router = useRouter();
  const [orderBusy, setOrderBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const attemptKey = useRef<string | null>(null);
  const attemptPayload = useRef<PlaceOrderInput | null>(null);
  const orderLock = useRef(false);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem("dwellune-order-attempt");
    } catch {
      /* Cookie-backed replay remains available. */
    }
    if (!saved) return;
    attemptKey.current = saved;
    const controller = new AbortController();
    void fetch(`/api/checkout/orders?attempt=${encodeURIComponent(saved)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        if (data.order) {
          const result = orderConfirmationSchema.parse(data.order);
          try {
            sessionStorage.removeItem("dwellune-order-attempt");
          } catch {}
          router.replace(`/checkout/confirmation/${result.id}` as Route);
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [router]);
  const [context, setContext] = useState<CheckoutContext | null>(null);
  const [contextError, setContextError] = useState("");
  const [retry, setRetry] = useState(0);
  const [values, setValues] = useState<Values>(empty);
  const [quoteState, setQuote] = useState<CheckoutQuote | null>(null);
  const [sourceCart, setSourceCart] = useState<Cart | null>(null);
  const quote = sourceCart === commerce.data?.cart && !commerce.pending ? quoteState : null;
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [discount, setDiscount] = useState("");
  const version = useRef(0);
  const edited = useRef(false);
  const request = useRef<AbortController | null>(null);
  const validUntil = useRef(0);
  useEffect(() => {
    const invalidateAccount = () => {
      attemptKey.current = null;
      attemptPayload.current = null;
      setUncertain(false);
      try {
        sessionStorage.removeItem("dwellune-order-attempt");
      } catch {}
      edited.current = false;
      version.current++;
      request.current?.abort();
      setPending(false);
      setQuote(null);
      setContext(null);
      setValues(empty);
      setRetry((n) => n + 1);
    };
    const storage = (event: StorageEvent) => {
      if (event.key === "dwellune-auth-change") invalidateAccount();
    };
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("dwellune-account");
        channel.onmessage = invalidateAccount;
      }
    } catch {
      // Storage events and cookie-backed requests remain available.
    }
    window.addEventListener("storage", storage);
    return () => {
      channel?.close();
      window.removeEventListener("storage", storage);
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/checkout", {
      cache: "no-store",
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
    })
      .then(async (r) => {
        const data: unknown = await r.json();
        if (!r.ok)
          throw new Error(
            typeof data === "object" &&
              data !== null &&
              "error" in data &&
              typeof data.error === "string"
              ? data.error
              : "Account details are unavailable.",
          );
        return checkoutContextSchema.parse(data);
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setContext(data);
        setContextError("");
        if (!edited.current) {
          const address = data.addresses.find((a) => a.is_default);
          setValues({
            ...empty,
            name: address?.recipient_name ?? data.name,
            email: data.email,
            phone: address?.phone ?? data.phone,
            line1: address?.address_line1 ?? "",
            line2: address?.address_line2 ?? "",
            city: address?.city ?? "",
            province: address?.province ?? "Punjab",
            postalCode: address?.postal_code ?? "",
            savedAddressId: address?.id ?? "",
          });
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setContextError(e instanceof Error ? e.message : "Please retry loading your details.");
      });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    version.current++;
    request.current?.abort();
  }, [commerce.data?.cart, commerce.pending]);
  useEffect(() => {
    if (!quote) return;
    const invalidate = () => {
      setQuote(null);
      setMessage(
        "Your quote expired or the page was reopened. Review checkout again for current totals.",
      );
    };
    const timer = window.setTimeout(invalidate, Math.max(0, validUntil.current - Date.now()));
    const visible = () => {
      if (document.visibilityState === "visible") invalidate();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [quote]);
  useEffect(() => () => request.current?.abort(), []);
  function change<K extends keyof Values>(key: K, value: Values[K]) {
    edited.current = true;
    version.current++;
    request.current?.abort();
    setPending(false);
    setQuote(null);
    setMessage("");
    setFields({});
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(["line1", "line2", "city", "province", "postalCode"].includes(key)
        ? { savedAddressId: "" }
        : {}),
    }));
  }
  function selectAddress(id: string) {
    const address = context?.addresses.find((a) => a.id === id);
    change("savedAddressId", id);
    if (address)
      setValues((v) => ({
        ...v,
        name: address.recipient_name,
        phone: address.phone,
        line1: address.address_line1,
        line2: address.address_line2 ?? "",
        city: address.city,
        province: address.province,
        postalCode: address.postal_code ?? "",
        savedAddressId: id,
      }));
  }
  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || commerce.pending || !context) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const generation = ++version.current;
    setPending(true);
    setMessage("");
    setFields({});
    setQuote(null);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        body: JSON.stringify({
          name: values.name,
          email: context.authenticated ? context.email : values.email,
          phone: values.phone,
          address: {
            line1: values.line1,
            line2: values.line2,
            city: values.city,
            province: values.province,
            postalCode: values.postalCode,
            country: "PK",
          },
          notes: values.notes,
          terms: values.terms,
          ...(values.savedAddressId ? { savedAddressId: values.savedAddressId } : {}),
        }),
      });
      const data = await r.json();
      if (generation !== version.current) return;
      if (!r.ok) {
        if (Array.isArray(data.fields))
          setFields(
            Object.fromEntries(
              data.fields.map((f: { path: string; message: string }) => [f.path, f.message]),
            ),
          );
        throw new Error(
          typeof data.error === "string" ? data.error : "Please retry your checkout review.",
        );
      }
      const result = checkoutQuoteSchema.parse(data);
      validUntil.current =
        Date.now() + Math.max(0, Date.parse(result.expires_at) - Date.parse(result.quoted_at));
      setSourceCart(commerce.data?.cart ?? null);
      setQuote(result);
      setMessage("Your address and current totals have been checked. No order has been placed.");
    } catch (e) {
      if (generation === version.current && !controller.signal.aborted)
        setMessage(e instanceof Error ? e.message : "Please retry.");
    } finally {
      if (request.current === controller) setPending(false);
    }
  }
  function currentInput() {
    return {
      name: values.name,
      email: context?.authenticated ? context.email : values.email,
      phone: values.phone,
      address: {
        line1: values.line1,
        line2: values.line2,
        city: values.city,
        province: values.province,
        postalCode: values.postalCode,
        country: "PK",
      },
      notes: values.notes,
      terms: values.terms,
      ...(values.savedAddressId ? { savedAddressId: values.savedAddressId } : {}),
    };
  }
  async function submitOrder() {
    if (orderLock.current || (!attemptPayload.current && (!quote || !context?.ordersEnabled)))
      return;
    const generation = version.current;
    orderLock.current = true;
    setOrderBusy(true);
    setMessage("");
    try {
      const payload =
        attemptPayload.current ??
        placeOrderSchema.parse({
          input: currentInput(),
          revision: quote?.revision,
          idempotencyKey: attemptKey.current ?? crypto.randomUUID(),
        });
      attemptKey.current = payload.idempotencyKey;
      attemptPayload.current = payload;
      try {
        sessionStorage.setItem("dwellune-order-attempt", payload.idempotencyKey);
      } catch {}
      const response = await fetch("/api/checkout/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (generation !== version.current) return;
      if (!response.ok) {
        if (data.code === "idempotency_conflict") {
          const recovered = await fetch(`/api/checkout/orders?attempt=${payload.idempotencyKey}`, {
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
          });
          if (recovered.ok) {
            const found = await recovered.json();
            if (found.order) {
              const order = orderConfirmationSchema.parse(found.order);
              router.replace(`/checkout/confirmation/${order.id}` as Route);
              return;
            }
          }
        }
        if (response.status < 500 && data.code !== "idempotency_conflict") {
          attemptPayload.current = null;
          attemptKey.current = null;
          setUncertain(false);
          setQuote(null);
          try {
            sessionStorage.removeItem("dwellune-order-attempt");
          } catch {}
        } else setUncertain(true);
        throw new Error(data.error ?? "Your order result is uncertain. Retry the same attempt.");
      }
      const order = orderConfirmationSchema.parse(data);
      try {
        sessionStorage.removeItem("dwellune-order-attempt");
      } catch {}
      router.replace(`/checkout/confirmation/${order.id}` as Route);
      void commerce.refresh();
    } catch (e) {
      if (generation !== version.current) return;
      if (attemptPayload.current) setUncertain(true);
      setMessage(e instanceof Error ? e.message : "Retry the same order attempt.");
    } finally {
      orderLock.current = false;
      setOrderBusy(false);
    }
  }
  async function applyDiscount(code: string) {
    const generation = ++version.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setQuote(null);
    try {
      const response = await fetch("/api/checkout/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        body: JSON.stringify({
          address: currentInput().address,
          ...(values.savedAddressId ? { savedAddressId: values.savedAddressId } : {}),
          code,
        }),
      });
      const data = await response.json();
      if (generation !== version.current) return;
      if (!response.ok)
        throw new Error(data.error ?? "Please check your delivery address and discount.");
      checkoutQuoteSchema.parse(data);
      await commerce.refresh();
      setMessage(
        code
          ? "Discount updated. Review checkout again."
          : "Discount removed. Review checkout again.",
      );
    } catch (e) {
      if (generation === version.current && !controller.signal.aborted)
        setMessage(e instanceof Error ? e.message : "Please retry your discount.");
    } finally {
      if (request.current === controller) setPending(false);
    }
  }
  const cart = quote?.cart ?? commerce.data?.cart;
  if (commerce.loading || (!context && !contextError))
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Checkout</h1>
        <p role="status">Preparing your bag and checkout details…</p>
      </main>
    );
  if (commerce.error || contextError)
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Checkout</h1>
        <p role="alert" className={styles.error}>
          {commerce.error || contextError}
        </p>
        <DwelluneButton
          onClick={() => {
            setContextError("");
            setRetry((n) => n + 1);
            void commerce.refresh().catch(() => undefined);
          }}
        >
          Retry
        </DwelluneButton>
        <p>
          <Link href="/cart">Return to your bag</Link> ·{" "}
          <Link href="/auth/signin?next=%2Fcheckout">Sign in</Link>
        </p>
      </main>
    );
  if (!cart)
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Preparing checkout…</h1>
      </main>
    );
  if (!cart.lines.length && !uncertain && !orderBusy)
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Your bag is empty.</h1>
        <p className={styles.notice}>Add an object before reviewing checkout.</p>
        <DwelluneButtonLink href="/shop">Explore the collection</DwelluneButtonLink>
      </main>
    );
  const totals = quote?.cart.quote;
  const input = (key: keyof Values) => ({
    value: String(values[key]),
    error: fields[key],
  });
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>DWELLUNE · Cash on Delivery</p>
      <h1 className={styles.title}>A place for your selection.</h1>
      <p className={styles.intro}>
        Review your delivery details and current totals. Your bag stays saved throughout checkout.
      </p>
      <div className={styles.banner}>
        {context?.ordersEnabled
          ? "Review the current total, then place your Cash on Delivery order. No online payment is collected."
          : "Checkout review is open. Order placement awaits store configuration; your bag remains saved."}
      </div>
      <div className={styles.layout}>
        <form className={styles.form} onSubmit={review} aria-busy={pending}>
          <p>
            {context?.authenticated ? (
              `Signed in as ${context.email}`
            ) : (
              <>
                Continue as a guest, or{" "}
                <Link href="/auth/signin?next=%2Fcheckout">sign in to use saved addresses</Link>.
              </>
            )}
          </p>
          <fieldset className={styles.section} disabled={orderBusy || uncertain}>
            <legend>Contact details</legend>
            <TextField
              label="Full name"
              autoComplete="name"
              required
              maxLength={100}
              {...input("name")}
              onChange={(e) => change("name", e.target.value)}
            />
            <div className={styles.fields}>
              <TextField
                label="Email address"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                readOnly={context?.authenticated}
                {...input("email")}
                onChange={(e) => change("email", e.target.value)}
              />
              <TextField
                label="Mobile number"
                type="tel"
                autoComplete="tel"
                required
                maxLength={25}
                hint="Pakistan mobile number, e.g. 03001234567"
                {...input("phone")}
                onChange={(e) => change("phone", e.target.value)}
              />
            </div>
          </fieldset>
          <fieldset className={styles.section} disabled={orderBusy || uncertain}>
            <legend>Delivery address</legend>
            {context?.addresses.length ? (
              <SelectField
                label="Saved address"
                value={values.savedAddressId}
                onChange={(e) => selectAddress(e.target.value)}
                options={[
                  { value: "", label: "Enter a new address" },
                  ...context.addresses.map((a) => ({
                    value: a.id,
                    label: `${a.label || a.recipient_name} · ${a.city}${a.is_default ? " · Default" : ""}`,
                  })),
                ]}
              />
            ) : null}
            <TextField
              label="Street address"
              autoComplete="address-line1"
              required
              maxLength={200}
              {...input("line1")}
              onChange={(e) => change("line1", e.target.value)}
              error={fields["address.line1"]}
            />
            <TextField
              label="Apartment, building or landmark"
              autoComplete="address-line2"
              optional
              maxLength={200}
              {...input("line2")}
              onChange={(e) => change("line2", e.target.value)}
              error={fields["address.line2"]}
            />
            <div className={styles.fields}>
              <TextField
                label="City"
                autoComplete="address-level2"
                required
                maxLength={80}
                {...input("city")}
                onChange={(e) => change("city", e.target.value)}
                error={fields["address.city"]}
              />
              <SelectField
                label="Province / territory"
                autoComplete="address-level1"
                value={values.province}
                onChange={(e) => change("province", e.target.value)}
                required
                error={fields["address.province"]}
                options={provinces.map((v) => ({ value: v, label: v }))}
              />
            </div>
            <TextField
              label="Postal code"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={5}
              optional
              hint="Five digits, if available"
              {...input("postalCode")}
              onChange={(e) => change("postalCode", e.target.value)}
              error={fields["address.postalCode"]}
            />
            <p>Country: Pakistan</p>
            <TextAreaField
              label="Order notes"
              optional
              maxLength={1000}
              value={values.notes}
              onChange={(e) => change("notes", e.target.value)}
              error={fields.notes}
              hint="Delivery instructions only. Never include bank details or passwords."
            />
          </fieldset>
          <fieldset className={styles.section} disabled={orderBusy || uncertain}>
            <legend>Payment and returns</legend>
            <p className={styles.notice}>
              <strong>Cash on Delivery</strong> — pay the final amount when your order arrives. No
              online payment is collected.
            </p>
            <p className={styles.notice}>
              {context?.returnPolicy ??
                "Contact dwellunestore@gmail.com for return information before ordering."}
            </p>
            <CheckboxField
              label="I have reviewed the delivery, COD and return information."
              required
              checked={values.terms}
              onChange={(e) => change("terms", e.target.checked)}
            />
            {fields.terms ? (
              <p className={styles.error} role="alert">
                {fields.terms}
              </p>
            ) : null}
          </fieldset>
          <div className={styles.actions}>
            <DwelluneButton
              type="submit"
              disabled={pending || commerce.pending || orderBusy || uncertain}
            >
              {pending ? "Checking your selection…" : "Review checkout"}
            </DwelluneButton>
            <Link href="/cart">Edit your bag</Link>
          </div>
          {message ? (
            <p
              className={`${styles.notice} ${quote ? "" : styles.error}`}
              role={quote ? "status" : "alert"}
            >
              {message}
            </p>
          ) : null}
        </form>
        <aside className={styles.summary} aria-label="Order summary">
          <h2>Your selection</h2>
          {cart.lines.map((line) => (
            <div className={styles.item} key={line.variant_id}>
              <div>
                <strong>{line.product_name}</strong>
                <span>
                  {line.variant_title} · Quantity {line.quantity}
                </span>
                <Link href={`/products/${line.product_slug}`}>View item</Link>
              </div>
              <b>{formatPkr(line.line_total_pkr)}</b>
            </div>
          ))}
          <dl className={styles.totals}>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPkr(totals?.subtotal_pkr ?? cart.quote.subtotal_pkr)}</dd>
            </div>
            <div>
              <dt>Discount</dt>
              <dd>−{formatPkr(totals?.discount_pkr ?? cart.quote.discount_pkr)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>{totals ? formatPkr(totals.shipping_pkr) : "Confirm with address"}</dd>
            </div>
            <div className={styles.total}>
              <dt>Due on delivery</dt>
              <dd>{totals ? formatPkr(totals.total_pkr) : "Review checkout"}</dd>
            </div>
          </dl>
          <TextField
            label="Discount code"
            value={discount}
            onChange={(e) => {
              version.current++;
              request.current?.abort();
              setPending(false);
              setDiscount(e.target.value);
              setQuote(null);
            }}
            maxLength={80}
            disabled={orderBusy || uncertain}
          />
          <div className={styles.actions}>
            <DwelluneButton
              variant="frame"
              disabled={commerce.pending || pending || orderBusy || uncertain || !discount.trim()}
              onClick={() => void applyDiscount(discount)}
            >
              Apply
            </DwelluneButton>
            {cart.quote.discount_code ? (
              <DwelluneButton
                variant="quiet"
                disabled={commerce.pending || pending || orderBusy || uncertain}
                onClick={() => {
                  setDiscount("");
                  void applyDiscount("");
                }}
              >
                Remove {cart.quote.discount_code}
              </DwelluneButton>
            ) : null}
          </div>
          {quote ? (
            <>
              <p className={styles.notice}>
                {quote.delivery.name} · {quote.delivery.zone}. Estimated arrival:{" "}
                {totals?.estimated_days_min}–{totals?.estimated_days_max} days.
              </p>
              {quote.delivery.surcharge_pkr > 0 ? (
                <p>Included area surcharge: {formatPkr(quote.delivery.surcharge_pkr)}</p>
              ) : null}
              {quote.needs_stock_revalidation ? (
                <p className={styles.notice}>
                  Stock is currently available but must be reserved again before order placement.
                </p>
              ) : null}
              {quote.contains_test_product ? (
                <p className={styles.notice}>
                  <strong>Test selection:</strong> this bag contains a demonstration product and is
                  not available for real fulfillment.
                </p>
              ) : null}
            </>
          ) : (
            <p className={styles.notice}>
              Enter your address and review checkout to confirm delivery eligibility and total.
            </p>
          )}
          <DwelluneButton
            onClick={() => void submitOrder()}
            disabled={
              orderBusy ||
              pending ||
              commerce.pending ||
              (!uncertain && (!quote || !context?.ordersEnabled || quote.contains_test_product))
            }
          >
            {orderBusy
              ? "Placing your order…"
              : uncertain
                ? "Retry same order attempt"
                : context?.ordersEnabled
                  ? "Place Cash on Delivery order"
                  : "Order placement awaits configuration"}
          </DwelluneButton>
          {uncertain ? (
            <p role="alert">
              The result is uncertain. Retry this same attempt to check or complete it without
              creating a duplicate. Do not place another order from a different browser.
            </p>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
