"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  commerceResponseSchema,
  savedIdsFromStorage,
  type CommerceAction,
  type CommerceResponse,
  type SavedLine,
} from "@/lib/commerce";

const SAVED_KEY = "dwellune-saved-ids-v2";
const LEGACY_KEY = "dwellune-commerce-v1";
const IMPORT_KEY = "dwellune-cart-import-v2";
export type CommerceProductSnapshot = {
  variantId: string;
  productSlug: string;
  productName: string;
  variantTitle: string;
  displayPricePkr: number;
  mediaUrl: string | null;
};
type CommerceContextValue = {
  data: CommerceResponse | null;
  wishlist: SavedLine[];
  bagCount: number;
  wishlistCount: number;
  loading: boolean;
  pending: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addToBag: (snapshot: CommerceProductSnapshot, quantity: number) => Promise<void>;
  setQuantity: (variantId: string, quantity: number) => Promise<void>;
  applyDiscount: (code: string) => Promise<void>;
  toggleWishlist: (snapshot: CommerceProductSnapshot) => Promise<boolean>;
  removeFromWishlist: (variantId: string) => Promise<void>;
  moveToBag: (variantId: string) => Promise<void>;
  isWishlisted: (variantId: string) => boolean;
};
const CommerceContext = createContext<CommerceContextValue | null>(null);

export function StoreCommerceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CommerceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef<CommerceResponse | null>(null);
  const ids = useRef<string[]>([]);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const channel = useRef<BroadcastChannel | null>(null);
  const alive = useRef(false);
  const authVersion = useRef(0);

  const request = useCallback((action?: CommerceAction, broadcast = false): Promise<void> => {
    const operation = queue.current
      .catch(() => undefined)
      .then(async () => {
        if (!alive.current) return;
        const version = authVersion.current;
        setPending(true);
        setError(null);
        try {
          const query = new URLSearchParams(ids.current.map((id) => ["saved", id]));
          const response = await fetch(`/api/commerce?${query}`, {
            method: action ? "POST" : "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: action ? { "Content-Type": "application/json" } : undefined,
            body: action ? JSON.stringify(action) : undefined,
            signal: AbortSignal.timeout(15000),
          });
          const json: unknown = await response.json();
          if (!response.ok)
            throw new Error(
              typeof json === "object" &&
                json !== null &&
                "error" in json &&
                typeof json.error === "string"
                ? json.error
                : "Please retry your selection.",
            );
          const next = commerceResponseSchema.parse(json);
          if (version !== authVersion.current) return;
          dataRef.current = next;
          if (alive.current) setData(next);
          if (broadcast) channel.current?.postMessage("refresh");
        } catch (caught) {
          const message =
            caught instanceof Error && caught.name !== "ZodError"
              ? caught.message
              : "We could not load your selection. Please retry.";
          if (alive.current) setError(message);
          throw new Error(message);
        } finally {
          if (alive.current) {
            setLoading(false);
            setPending(false);
          }
        }
      });
    queue.current = operation;
    return operation;
  }, []);

  const refresh = useCallback(() => request(), [request]);
  const synchronize = useCallback(async () => {
    await request();
    if (dataRef.current?.cart.authenticated && ids.current.length) {
      await request({ action: "sync", savedIds: ids.current }, true);
      // The local guest selection is cleared only after durable account persistence.
      localStorage.removeItem(SAVED_KEY);
      ids.current = [];
    }
  }, [request]);

  useEffect(() => {
    alive.current = true;
    let unsubscribe: (() => void) | undefined;
    try {
      ids.current = savedIdsFromStorage(localStorage.getItem(SAVED_KEY));
      const legacy: unknown = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "null");
      if (
        legacy &&
        typeof legacy === "object" &&
        "wishlist" in legacy &&
        Array.isArray(legacy.wishlist)
      ) {
        ids.current = [
          ...new Set([
            ...ids.current,
            ...savedIdsFromStorage(
              JSON.stringify(
                legacy.wishlist.map((v: unknown) =>
                  v && typeof v === "object" && "variantId" in v ? v.variantId : null,
                ),
              ),
            ),
          ]),
        ].slice(0, 50);
        localStorage.setItem(SAVED_KEY, JSON.stringify(ids.current));
      }
      if (
        legacy &&
        typeof legacy === "object" &&
        "bag" in legacy &&
        Array.isArray(legacy.bag) &&
        legacy.bag.length &&
        !localStorage.getItem(IMPORT_KEY)
      ) {
        const lines = legacy.bag
          .flatMap((v: unknown) => {
            if (
              !v ||
              typeof v !== "object" ||
              !("variantId" in v) ||
              !("quantity" in v) ||
              !savedIdsFromStorage(JSON.stringify([v.variantId])).length ||
              typeof v.quantity !== "number" ||
              !Number.isInteger(v.quantity) ||
              v.quantity < 1 ||
              v.quantity > 99
            )
              return [];
            return [{ variantId: v.variantId, quantity: v.quantity }];
          })
          .slice(0, 30);
        if (lines.length)
          localStorage.setItem(
            IMPORT_KEY,
            JSON.stringify({ action: "import", importId: crypto.randomUUID(), lines }),
          );
      }
    } catch {
      /* A blocked storage API still permits a server-persisted cart. */
    }
    const start = async () => {
      let imported = false;
      try {
        // Establish the HttpOnly guest identity before a replayable import.
        await request();
        const raw = localStorage.getItem(IMPORT_KEY);
        if (raw) {
          const { commerceActionSchema } = await import("@/lib/commerce");
          await request(commerceActionSchema.parse(JSON.parse(raw)), true);
          localStorage.removeItem(IMPORT_KEY);
          imported = true;
        }
        await synchronize();
        if (imported || !localStorage.getItem(IMPORT_KEY)) localStorage.removeItem(LEGACY_KEY);
      } catch {
        /* Keep legacy data intact for retry; the request exposes its error. */
      }
    };
    void start();
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel("dwellune-commerce");
      bc.onmessage = () => {
        void refresh().catch(() => undefined);
      };
      channel.current = bc;
    }
    void import("@/lib/supabase/client").then(({ createClient }) => {
      if (!alive.current) return;
      const { data: subscription } = createClient().auth.onAuthStateChange((event) => {
        if (event === "INITIAL_SESSION") return;
        // Defer work outside the Auth callback and immediately hide the previous account.
        authVersion.current += 1;
        dataRef.current = null;
        setData(null);
        setLoading(true);
        setTimeout(() => {
          if (alive.current) void synchronize().catch(() => undefined);
        }, 0);
      });
      unsubscribe = () => subscription.subscription.unsubscribe();
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === SAVED_KEY) {
        ids.current = savedIdsFromStorage(event.newValue);
        void synchronize().catch(() => undefined);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh().catch(() => undefined);
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(onVisible, 60000);
    return () => {
      alive.current = false;
      unsubscribe?.();
      channel.current?.close();
      channel.current = null;
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [refresh, request, synchronize]);

  const save = async (variantId: string, saved: boolean) => {
    if (dataRef.current?.cart.authenticated) {
      await request({ action: "save", variantId, saved }, true);
      return;
    }
    const before = ids.current;
    const next = saved
      ? [...new Set([...before, variantId])]
      : before.filter((id) => id !== variantId);
    if (next.length > 50)
      throw new Error("You can save up to 50 objects. Remove one before saving another.");
    ids.current = next;
    try {
      await request();
      // Canonical availability is checked before reporting that a guest object is saved.
      if (saved && !dataRef.current?.wishlist.some((line) => line.variant_id === variantId))
        throw new Error("This selection is no longer available to save.");
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    } catch (caught) {
      ids.current = before;
      await request().catch(() => undefined);
      throw caught;
    }
  };
  const wishlist = data?.wishlist ?? [];
  return (
    <CommerceContext.Provider
      value={{
        data,
        wishlist,
        bagCount: data?.cart.item_count ?? 0,
        wishlistCount: wishlist.length,
        loading,
        pending,
        error,
        refresh,
        addToBag: (snapshot, quantity) =>
          request({ action: "add", variantId: snapshot.variantId, quantity }, true),
        setQuantity: (variantId, quantity) =>
          request({ action: "quantity", variantId, quantity }, true),
        applyDiscount: (code) => request({ action: "discount", code }, true),
        toggleWishlist: async (snapshot) => {
          const saved = !dataRef.current?.wishlist.some(
            (line) => line.variant_id === snapshot.variantId,
          );
          await save(snapshot.variantId, saved);
          return saved;
        },
        removeFromWishlist: (variantId) => save(variantId, false),
        moveToBag: async (variantId) => {
          await request({ action: "move", variantId }, true);
          if (!dataRef.current?.cart.authenticated) await save(variantId, false);
        },
        isWishlisted: (variantId) => wishlist.some((line) => line.variant_id === variantId),
      }}
    >
      {children}
    </CommerceContext.Provider>
  );
}

export function useStoreCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useStoreCommerce requires StoreCommerceProvider");
  return context;
}
