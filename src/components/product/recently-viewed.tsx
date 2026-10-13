"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock3, PackageOpen } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import { formatPkr } from "@/lib/product-detail";

import styles from "./product-detail.module.css";

const STORAGE_KEY = "dwellune-recently-viewed-v1";
const EMPTY: RecentProduct[] = [];
let snapshot: RecentProduct[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

type RecentProduct = {
  slug: string;
  name: string;
  mediaUrl: string | null;
  pricePkr: number | null;
};

function isRecent(value: unknown): value is RecentProduct {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    (typeof item.mediaUrl === "string" || item.mediaUrl === null) &&
    (typeof item.pricePkr === "number" || item.pricePkr === null)
  );
}

function parse(raw: string | null) {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isRecent).slice(0, 6) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  snapshot = parse(window.localStorage.getItem(STORAGE_KEY));
  hydrated = true;
}

function getSnapshot() {
  hydrate();
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = parse(event.newValue);
    hydrated = true;
    for (const callback of listeners) callback();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

function recordViewed(product: RecentProduct) {
  hydrate();
  snapshot = [product, ...snapshot.filter((item) => item.slug !== product.slug)].slice(0, 6);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  for (const listener of listeners) listener();
}

export function RecentlyViewed({ current }: { current: RecentProduct }) {
  const products = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const previous = products.filter((product) => product.slug !== current.slug).slice(0, 4);

  useEffect(() => {
    recordViewed(current);
  }, [current]);

  if (!previous.length) return null;

  return (
    <section className={styles.recentSection} aria-labelledby="recently-viewed-title">
      <header className={styles.sectionHeading}>
        <p>From your visit</p>
        <h2 id="recently-viewed-title">Recently viewed</h2>
      </header>
      <div className={styles.recentGrid}>
        {previous.map((product) => (
          <Link
            className={styles.recentItem}
            href={`/products/${product.slug}` as Route}
            key={product.slug}
          >
            <div className={styles.recentMedia}>
              {product.mediaUrl ? (
                <Image alt="" fill sizes="(max-width: 40rem) 42vw, 16rem" src={product.mediaUrl} />
              ) : (
                <PackageOpen aria-hidden="true" />
              )}
            </div>
            <div>
              <Clock3 aria-hidden="true" />
              <strong>{product.name}</strong>
              {product.pricePkr !== null ? <span>From {formatPkr(product.pricePkr)}</span> : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
