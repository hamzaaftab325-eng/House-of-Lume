"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "house-of-lume-commerce-v1";

export type CommerceProductSnapshot = {
  variantId: string;
  productSlug: string;
  productName: string;
  variantTitle: string;
  displayPricePkr: number;
  mediaUrl: string | null;
};

export type BagLine = CommerceProductSnapshot & { quantity: number };
export type WishlistLine = CommerceProductSnapshot;

type CommerceState = {
  bag: BagLine[];
  wishlist: WishlistLine[];
};

const EMPTY_STATE: CommerceState = { bag: [], wishlist: [] };
let currentState: CommerceState = EMPTY_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function isSnapshot(value: unknown): value is CommerceProductSnapshot {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.variantId === "string" &&
    typeof record.productSlug === "string" &&
    typeof record.productName === "string" &&
    typeof record.variantTitle === "string" &&
    typeof record.displayPricePkr === "number" &&
    (typeof record.mediaUrl === "string" || record.mediaUrl === null)
  );
}

function parseState(raw: string | null): CommerceState {
  if (!raw) return EMPTY_STATE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY_STATE;
    const record = parsed as Record<string, unknown>;
    const bag = Array.isArray(record.bag)
      ? record.bag.filter(
          (line): line is BagLine =>
            isSnapshot(line) &&
            typeof (line as Record<string, unknown>).quantity === "number" &&
            Number.isInteger((line as Record<string, unknown>).quantity) &&
            ((line as Record<string, unknown>).quantity as number) > 0,
        )
      : [];
    const wishlist = Array.isArray(record.wishlist)
      ? record.wishlist.filter(isSnapshot)
      : [];
    return { bag, wishlist };
  } catch {
    return EMPTY_STATE;
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  currentState = parseState(window.localStorage.getItem(STORAGE_KEY));
  hydrated = true;
}

function getSnapshot() {
  hydrate();
  return currentState;
}

function getServerSnapshot() {
  return EMPTY_STATE;
}

function emit() {
  for (const listener of listeners) listener();
}

function writeState(next: CommerceState) {
  currentState = next;
  hydrated = true;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    currentState = parseState(event.newValue);
    hydrated = true;
    emit();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

export function useStoreCommerce() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    bag: state.bag,
    wishlist: state.wishlist,
    bagCount: state.bag.reduce((sum, line) => sum + line.quantity, 0),
    wishlistCount: state.wishlist.length,
    addToBag(snapshot: CommerceProductSnapshot, quantity: number, maxQuantity = 99) {
      hydrate();
      const safeQuantity = Math.max(1, Math.min(Math.round(quantity), maxQuantity, 99));
      const existing = currentState.bag.find((line) => line.variantId === snapshot.variantId);
      const bag = existing
        ? currentState.bag.map((line) =>
            line.variantId === snapshot.variantId
              ? {
                  ...line,
                  ...snapshot,
                  quantity: Math.min(line.quantity + safeQuantity, maxQuantity, 99),
                }
              : line,
          )
        : [...currentState.bag, { ...snapshot, quantity: safeQuantity }];
      writeState({ ...currentState, bag });
    },
    removeFromBag(variantId: string) {
      hydrate();
      writeState({
        ...currentState,
        bag: currentState.bag.filter((line) => line.variantId !== variantId),
      });
    },
    toggleWishlist(snapshot: CommerceProductSnapshot) {
      hydrate();
      const exists = currentState.wishlist.some((line) => line.variantId === snapshot.variantId);
      const wishlist = exists
        ? currentState.wishlist.filter((line) => line.variantId !== snapshot.variantId)
        : [...currentState.wishlist, snapshot];
      writeState({ ...currentState, wishlist });
      return !exists;
    },
    removeFromWishlist(variantId: string) {
      hydrate();
      writeState({
        ...currentState,
        wishlist: currentState.wishlist.filter((line) => line.variantId !== variantId),
      });
    },
    isWishlisted(variantId: string) {
      return state.wishlist.some((line) => line.variantId === variantId);
    },
  };
}
