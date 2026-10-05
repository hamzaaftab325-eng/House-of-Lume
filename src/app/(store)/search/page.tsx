import type { Metadata } from "next";

import {
  DemoLampArt,
  DemoObjectArt,
  DemoPlantArt,
  ProductUnit,
} from "@/components/editorial/editorial";
import { LumeButtonLink } from "@/components/ui/controls";
import { searchPublishedProducts, type HomepageProduct } from "@/server/homepage";

import styles from "./search.module.css";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the published House of Lume catalogue.",
  robots: {
    index: false,
    follow: true,
  },
};

function ProductArtwork({ type }: { type: HomepageProduct["productType"] }) {
  if (type === "plant" || type === "planter") return <DemoPlantArt />;
  if (type === "lamp" || type === "candle") return <DemoLampArt />;
  return <DemoObjectArt />;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = rawQuery?.trim().slice(0, 80) ?? "";
  const products = query.length >= 2 ? await searchPublishedProducts(query) : [];

  return (
    <main className={styles.page}>
      <div className="site-shell">
        <header className={styles.header}>
          <p className={styles.kicker}>Search House of Lume</p>
          <h1>{query ? `Results for “${query}”` : "Find a considered object."}</h1>
          <form className={styles.form} action="/search" method="get" role="search">
            <label className="sr-only" htmlFor="catalogue-search">
              Search published products
            </label>
            <input
              id="catalogue-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Try ‘lamp’ or ‘olive’"
              minLength={2}
              maxLength={80}
              required
            />
            <button type="submit">Search</button>
          </form>
        </header>

        {query.length > 0 && query.length < 2 ? (
          <div className={styles.empty}>
            <h2>Use at least two characters.</h2>
            <p>A slightly broader query helps us return useful catalogue matches.</p>
          </div>
        ) : null}

        {query.length >= 2 && products.length === 0 ? (
          <div className={styles.empty}>
            <h2>No published products match yet.</h2>
            <p>
              The search route is connected to the live catalogue. Products will appear here as soon
              as they are published in the House of Lume database.
            </p>
            <LumeButtonLink href="/#collections" showArrow>
              Browse categories
            </LumeButtonLink>
          </div>
        ) : null}

        {products.length > 0 ? (
          <section className={styles.results} aria-label="Search results">
            {products.map((product, index) => (
              <ProductUnit
                key={product.id}
                index={String(index + 1).padStart(2, "0")}
                name={product.name}
                context={product.description}
                price={product.priceLabel}
                label={product.productType.replaceAll("_", " ")}
                tone={
                  product.productType === "plant" || product.productType === "planter"
                    ? "olive"
                    : "paper"
                }
              >
                <ProductArtwork type={product.productType} />
              </ProductUnit>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
