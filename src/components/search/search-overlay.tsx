"use client";

import type { Route } from "next";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { LumeButton } from "@/components/ui/controls";
import { LumeDialog } from "@/components/ui/overlays";

import styles from "./search-overlay.module.css";

type SuggestionItem = {
  kind: "product" | "category" | "collection";
  label: string;
  href: Route;
  meta: string;
};

type SearchPayload = {
  products: Array<{ name: string; slug: string; product_type: string }>;
  categories: Array<{ name: string; slug: string; description: string | null }>;
  collections: Array<{ name: string; slug: string; description: string | null }>;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const RECENTS_KEY = "house-of-lume-recent-searches";

function loadRecents() {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECENTS_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string").slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  const cleaned = query.trim();
  if (!cleaned) return;
  const next = [
    cleaned,
    ...loadRecents().filter((item) => item.toLowerCase() !== cleaned.toLowerCase()),
  ].slice(0, 5);
  window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
}

export function SearchOverlay({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [payload, setPayload] = useState<SearchPayload>({
    products: [],
    categories: [],
    collections: [],
  });
  const [recents, setRecents] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const hasSearchQuery = query.trim().length >= 2;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      abortRef.current?.abort();
      return;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Search request failed");
        const data = (await response.json()) as SearchPayload;
        setPayload(data);
        setStatus("ready");
        setActiveIndex(-1);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [query]);

  const items = useMemo<SuggestionItem[]>(() => {
    if (!hasSearchQuery) return [];

    return [
      ...payload.products.map((item) => ({
        kind: "product" as const,
        label: item.name,
        href: `/products/${item.slug}` as Route,
        meta: item.product_type,
      })),
      ...payload.categories.map((item) => ({
        kind: "category" as const,
        label: item.name,
        href: `/categories/${item.slug}` as Route,
        meta: "Category",
      })),
      ...payload.collections.map((item) => ({
        kind: "collection" as const,
        label: item.name,
        href: `/collections/${item.slug}` as Route,
        meta: "Collection",
      })),
    ];
  }, [hasSearchQuery, payload]);

  const refreshRecents = () => {
    setRecents(loadRecents());
    setActiveIndex(-1);
  };

  const clearQuery = () => {
    abortRef.current?.abort();
    setQuery("");
    setStatus("idle");
    setActiveIndex(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!items.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + items.length) % items.length);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const item = items[activeIndex];
      if (item) {
        saveRecent(query);
        window.location.assign(item.href);
      }
    }
  };

  return (
    <LumeDialog
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Search House of Lume"
      title="Find an object by mood, room, or material."
      description="Search published objects, categories, and curated collections."
      size="search"
    >
      <form
        className={styles.form}
        action="/search"
        method="get"
        onSubmit={() => saveRecent(query)}
      >
        <label className="sr-only" htmlFor="global-search">
          Search House of Lume
        </label>
        <div className={styles.inputWrap}>
          <Search aria-hidden="true" />
          <input
            autoFocus
            aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
            aria-autocomplete="list"
            aria-controls="predictive-search-results"
            autoComplete="off"
            id="global-search"
            name="q"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
            }}
            onFocus={refreshRecents}
            onKeyDown={onKeyDown}
            placeholder="Try ‘warm reading light’"
            type="search"
            value={query}
          />
          {query ? (
            <button
              aria-label="Clear search"
              className={styles.clear}
              type="button"
              onClick={clearQuery}
            >
              <X aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <LumeButton type="submit" showArrow disabled={!query.trim()}>
          Search
        </LumeButton>
      </form>

      <p className={styles.status} role="status" aria-live="polite">
        {hasSearchQuery && status === "loading" ? "Searching the house…" : null}
        {hasSearchQuery && status === "error"
          ? "Search is temporarily unavailable. Use the full catalogue instead."
          : null}
        {hasSearchQuery && status === "ready" && !items.length ? "No close matches yet." : null}
      </p>

      {items.length ? (
        <div
          className={styles.results}
          id="predictive-search-results"
          role="listbox"
          aria-label="Search suggestions"
        >
          {items.map((item, index) => (
            <Link
              aria-selected={index === activeIndex}
              className={styles.result}
              href={item.href}
              id={`search-result-${index}`}
              key={`${item.kind}-${item.href}`}
              onClick={() => {
                saveRecent(query);
                onOpenChange(false);
              }}
              role="option"
            >
              <span>{item.label}</span>
              <small>{item.meta}</small>
            </Link>
          ))}
          <Link
            className={styles.viewAll}
            href={`/search?q=${encodeURIComponent(query.trim())}` as Route}
            onClick={() => {
              saveRecent(query);
              onOpenChange(false);
            }}
          >
            View all results for “{query.trim()}”
          </Link>
        </div>
      ) : !hasSearchQuery && recents.length ? (
        <div className={styles.recents}>
          <div className={styles.recentHeading}>
            <h3>Recent searches</h3>
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem(RECENTS_KEY);
                setRecents([]);
              }}
            >
              Clear
            </button>
          </div>
          <div className={styles.recentList}>
            {recents.map((recent) => (
              <Link
                key={recent}
                href={`/search?q=${encodeURIComponent(recent)}` as Route}
                onClick={() => onOpenChange(false)}
              >
                <Search aria-hidden="true" /> {recent}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.destinations}>
          <Link href={"/categories/lighting" as Route} onClick={() => onOpenChange(false)}>
            Lighting
          </Link>
          <Link href={"/categories/plants" as Route} onClick={() => onOpenChange(false)}>
            Living green
          </Link>
          <Link href={"/collections/new-arrivals" as Route} onClick={() => onOpenChange(false)}>
            New arrivals
          </Link>
          <Link href={"/shop" as Route} onClick={() => onOpenChange(false)}>
            Shop all
          </Link>
        </div>
      )}
    </LumeDialog>
  );
}
