"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { Route } from "next";
import Link from "next/link";
import { Search, X } from "lucide-react";

import { LumeDialog } from "@/components/ui/overlays";
import { LumeButton } from "@/components/ui/controls";

import styles from "./search-overlay.module.css";

type SuggestionProduct = {
  id: string;
  name: string;
  slug: string;
  productType: string;
  minPricePkr: number | null;
  inStock: boolean;
};

type SuggestionDestination = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
};

type SuggestionEditorial = {
  id: string;
  name: string;
  description: string;
  href: string;
};

type SuggestionPayload = {
  products: SuggestionProduct[];
  categories: SuggestionDestination[];
  collections: SuggestionDestination[];
  editorial: SuggestionEditorial[];
};

type FlatSuggestion = {
  key: string;
  label: string;
  meta: string;
  href: string;
};

type SearchOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const RECENT_SEARCH_KEY = "house-of-lume:recent-searches";
const MAX_RECENT_SEARCHES = 5;
const emptySuggestions: SuggestionPayload = {
  products: [],
  categories: [],
  collections: [],
  editorial: [],
};

function isSuggestionPayload(value: unknown): value is SuggestionPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.products) &&
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.collections) &&
    Array.isArray(candidate.editorial)
  );
}

function readRecentSearches() {
  try {
    const value = window.localStorage.getItem(RECENT_SEARCH_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed)
      ? parsed
          .filter((item): item is string => typeof item === "string")
          .slice(0, MAX_RECENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < 2) return;
  const current = readRecentSearches().filter(
    (item) => item.toLocaleLowerCase("en") !== normalized.toLocaleLowerCase("en"),
  );
  window.localStorage.setItem(
    RECENT_SEARCH_KEY,
    JSON.stringify([normalized, ...current].slice(0, MAX_RECENT_SEARCHES)),
  );
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionPayload>(emptySuggestions);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      setRecentSearches(readRecentSearches());
      setActiveIndex(-1);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const normalized = query.trim().replace(/\s+/g, " ");
    requestRef.current?.abort();

    if (normalized.length < 2) return;

    const controller = new AbortController();
    requestRef.current = controller;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Search suggestions failed");
        const payload: unknown = await response.json();
        if (!isSuggestionPayload(payload)) throw new Error("Invalid search response");
        setSuggestions(payload);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions(emptySuggestions);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  const flatSuggestions = useMemo<FlatSuggestion[]>(() => {
    const products = suggestions.products.map((product) => ({
      key: `product-${product.id}`,
      label: product.name,
      meta: product.inStock ? product.productType : `${product.productType} · unavailable`,
      href: `/search?q=${encodeURIComponent(product.name)}`,
    }));
    const categories = suggestions.categories.map((category) => ({
      key: `category-${category.id}`,
      label: category.name,
      meta: "Category",
      href: `/categories/${category.slug}`,
    }));
    const collections = suggestions.collections.map((collection) => ({
      key: `collection-${collection.id}`,
      label: collection.name,
      meta: "Collection",
      href: `/collections/${collection.slug}`,
    }));
    const editorial = suggestions.editorial.map((item) => ({
      key: `editorial-${item.id}`,
      label: item.name,
      meta: "Editorial",
      href: item.href,
    }));
    return [...products, ...categories, ...collections, ...editorial];
  }, [suggestions]);

  const commitSearch = (value: string) => {
    saveRecentSearch(value);
    setRecentSearches(readRecentSearches());
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (query.trim().length < 2) {
      event.preventDefault();
      return;
    }
    commitSearch(query);
    onOpenChange(false);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && flatSuggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % flatSuggestions.length);
      return;
    }
    if (event.key === "ArrowUp" && flatSuggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? flatSuggestions.length - 1 : current - 1));
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      const active = flatSuggestions[activeIndex];
      if (!active) return;
      event.preventDefault();
      commitSearch(active.label);
      window.location.assign(active.href);
      onOpenChange(false);
      return;
    }
    if (event.key === "Escape") setActiveIndex(-1);
  };

  const normalizedQuery = query.trim();
  const hasSuggestionResults = flatSuggestions.length > 0;
  const showNoResults = normalizedQuery.length >= 2 && !loading && !hasSuggestionResults;

  const renderDestination = (item: SuggestionDestination, type: "category" | "collection") => {
    const key = `${type}-${item.id}`;
    const index = flatSuggestions.findIndex((suggestion) => suggestion.key === key);
    const href = type === "category" ? `/categories/${item.slug}` : `/collections/${item.slug}`;

    return (
      <Link
        key={item.id}
        id={`${listboxId}-option-${index}`}
        role="option"
        aria-selected={activeIndex === index}
        data-active={activeIndex === index}
        href={href as Route}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => onOpenChange(false)}
      >
        <div>
          <span>{type === "category" ? "Category" : "Collection"}</span>
          <strong>{item.name}</strong>
        </div>
        <small>Explore →</small>
      </Link>
    );
  };

  return (
    <LumeDialog
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Search House of Lume"
      title="Find an object by mood, room, or material."
      description="Search the live catalogue, categories, curated collections, and editorial stories."
      size="search"
    >
      <form className={styles.form} action="/search" method="get" onSubmit={onSubmit} role="search">
        <div
          className={styles.inputWrap}
          role="combobox"
          aria-expanded={normalizedQuery.length >= 2}
          aria-controls={listboxId}
          aria-haspopup="listbox"
        >
          <Search size={20} aria-hidden="true" />
          <label className="sr-only" htmlFor="global-search">
            Search House of Lume
          </label>
          <input
            autoFocus
            id="global-search"
            name="q"
            type="search"
            value={query}
            placeholder="Try ‘warm lighting’ or ‘ceramic’"
            autoComplete="off"
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              setActiveIndex(-1);
              requestRef.current?.abort();
              setSuggestions(emptySuggestions);
              setLoading(nextQuery.trim().length >= 2);
            }}
            onKeyDown={onInputKeyDown}
          />
          {query ? (
            <button
              type="button"
              className={styles.clearButton}
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setActiveIndex(-1);
                setSuggestions(emptySuggestions);
                setLoading(false);
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <LumeButton type="submit" showArrow disabled={normalizedQuery.length < 2}>
          Search
        </LumeButton>
      </form>

      <div className={styles.status} aria-live="polite">
        {loading
          ? "Searching the house…"
          : normalizedQuery.length >= 2
            ? "Search suggestions updated."
            : ""}
      </div>

      {normalizedQuery.length < 2 ? (
        <div className={styles.startState}>
          {recentSearches.length > 0 ? (
            <section aria-labelledby="recent-searches-title">
              <div className={styles.sectionHeading}>
                <h3 id="recent-searches-title">Recent searches</h3>
                <button
                  type="button"
                  onClick={() => {
                    window.localStorage.removeItem(RECENT_SEARCH_KEY);
                    setRecentSearches([]);
                  }}
                >
                  Clear
                </button>
              </div>
              <div className={styles.recentList}>
                {recentSearches.map((recent) => (
                  <Link
                    key={recent}
                    href={`/search?q=${encodeURIComponent(recent)}` as Route}
                    onClick={() => onOpenChange(false)}
                  >
                    <span>{recent}</span>
                    <Search size={14} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="search-paths-title">
            <div className={styles.sectionHeading}>
              <h3 id="search-paths-title">Explore directly</h3>
            </div>
            <div className={styles.quickPaths}>
              <Link href="/categories/lighting" onClick={() => onOpenChange(false)}>
                <span>01</span>
                <strong>Lighting</strong>
                <small>Warmth after dark</small>
              </Link>
              <Link href="/categories/plants" onClick={() => onOpenChange(false)}>
                <span>02</span>
                <strong>Living green</strong>
                <small>Natural rhythm</small>
              </Link>
              <Link href="/collections/new-arrivals" onClick={() => onOpenChange(false)}>
                <span>03</span>
                <strong>New Arrivals</strong>
                <small>The latest edit</small>
              </Link>
            </div>
          </section>
        </div>
      ) : (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Predictive search results"
          className={styles.results}
        >
          {suggestions.products.length > 0 ? (
            <section aria-labelledby={`${listboxId}-products`}>
              <h3 id={`${listboxId}-products`}>Objects</h3>
              {suggestions.products.map((product) => {
                const index = flatSuggestions.findIndex(
                  (item) => item.key === `product-${product.id}`,
                );
                return (
                  <Link
                    key={product.id}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    data-active={activeIndex === index}
                    href={`/search?q=${encodeURIComponent(product.name)}` as Route}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      commitSearch(product.name);
                      onOpenChange(false);
                    }}
                  >
                    <div>
                      <span>{product.productType.replaceAll("_", " ")}</span>
                      <strong>{product.name}</strong>
                    </div>
                    <small>{product.inStock ? "In stock" : "Unavailable"}</small>
                  </Link>
                );
              })}
            </section>
          ) : null}

          {suggestions.categories.length > 0 ? (
            <section aria-labelledby={`${listboxId}-categories`}>
              <h3 id={`${listboxId}-categories`}>Categories</h3>
              {suggestions.categories.map((category) => renderDestination(category, "category"))}
            </section>
          ) : null}

          {suggestions.collections.length > 0 ? (
            <section aria-labelledby={`${listboxId}-collections`}>
              <h3 id={`${listboxId}-collections`}>Collections</h3>
              {suggestions.collections.map((collection) =>
                renderDestination(collection, "collection"),
              )}
            </section>
          ) : null}

          {suggestions.editorial.length > 0 ? (
            <section aria-labelledby={`${listboxId}-editorial`}>
              <h3 id={`${listboxId}-editorial`}>Editorial</h3>
              {suggestions.editorial.map((item) => {
                const index = flatSuggestions.findIndex(
                  (suggestion) => suggestion.key === `editorial-${item.id}`,
                );
                return (
                  <Link
                    key={item.id}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    data-active={activeIndex === index}
                    href={item.href as Route}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => onOpenChange(false)}
                  >
                    <div>
                      <span>Editorial</span>
                      <strong>{item.name}</strong>
                    </div>
                    <small>Read →</small>
                  </Link>
                );
              })}
            </section>
          ) : null}

          {showNoResults ? (
            <div className={styles.noResults} role="status">
              <p>No direct match for “{normalizedQuery}”.</p>
              <span>Try a broader material, room, category, collection, or story.</span>
              <div>
                <Link href="/categories/lighting" onClick={() => onOpenChange(false)}>
                  Lighting
                </Link>
                <Link href="/collections/new-arrivals" onClick={() => onOpenChange(false)}>
                  New Arrivals
                </Link>
                <Link href="/shop" onClick={() => onOpenChange(false)}>
                  Shop all
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </LumeDialog>
  );
}
