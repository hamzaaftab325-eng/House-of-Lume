import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PackageCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";

import { ConceptNav } from "@/components/concepts/concept-nav";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "Bento Grid Concept — House of Lume" };

const categories = [
  { index: "01", title: "Lighting", copy: "Warm pools of light for slower evenings.", tone: "blue" },
  { index: "02", title: "Living Green", copy: "Plants selected for real Pakistani homes.", tone: "sage" },
  { index: "03", title: "Objects", copy: "Quiet forms with texture and weight.", tone: "sand" },
  { index: "04", title: "Planters", copy: "Grounded vessels for living rooms and corners.", tone: "clay" },
] as const;

export default function BentoConceptPage() {
  return (
    <main className={styles.page}>
      <ConceptNav active="bento" />

      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Concept 01 · Bento Grid</p>
            <h1>A home that feels collected, not decorated.</h1>
            <p className={styles.lede}>
              A commerce-first homepage built from expressive modules: product stories, categories,
              services and editorial notes all live in one flexible visual system.
            </p>
            <div className={styles.actions}>
              <Link href="#collection" className={styles.primaryCta}>
                Explore the edit <ArrowRight aria-hidden="true" />
              </Link>
              <span>Light theme · modular · product-forward</span>
            </div>
          </div>

          <article className={`${styles.tile} ${styles.lampTile}`}>
            <span className={styles.tileIndex}>01 / Hero object</span>
            <div className={styles.lampArt} aria-hidden="true">
              <div className={styles.lampGlow} />
              <div className={styles.lampShade} />
              <div className={styles.lampStem} />
              <div className={styles.lampBase} />
            </div>
            <div className={styles.tileMeta}>
              <strong>Nocturne Lamp</strong>
              <span>Aged brass · warm glow</span>
            </div>
          </article>

          <article className={`${styles.tile} ${styles.plantTile}`}>
            <div className={styles.plantArt} aria-hidden="true">
              <i /><i /><i /><i /><i />
              <div />
            </div>
            <p>Living green<br /><strong>for softer rooms.</strong></p>
          </article>

          <article className={`${styles.tile} ${styles.noteTile}`}>
            <Sparkles aria-hidden="true" />
            <p>Good rooms are built from fewer, better decisions.</p>
            <span>House note · 01</span>
          </article>

          <article className={`${styles.tile} ${styles.serviceTile}`}>
            <span>Pakistan-wide</span>
            <strong>Delivery with Cash on Delivery.</strong>
            <Truck aria-hidden="true" />
          </article>
        </div>
      </section>

      <section className={styles.categorySection} aria-labelledby="bento-categories">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Shop by feeling</p>
          <h2 id="bento-categories">Four ways into the house.</h2>
        </div>
        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <article key={category.title} className={styles.category} data-tone={category.tone}>
              <span>{category.index}</span>
              <div>
                <h3>{category.title}</h3>
                <p>{category.copy}</p>
              </div>
              <ArrowRight aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section className={styles.collection} id="collection" aria-labelledby="bento-collection">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>The House Edit</p>
          <h2 id="bento-collection">Objects with room to breathe.</h2>
        </div>
        <div className={styles.productGrid}>
          <article className={styles.product}>
            <div className={`${styles.productStage} ${styles.stageBlue}`}><div className={styles.miniLamp} /></div>
            <span>01 · Lighting</span><h3>Arc Study Lamp</h3><p>Soft directional light, minimal footprint.</p>
          </article>
          <article className={styles.product}>
            <div className={`${styles.productStage} ${styles.stageSage}`}><div className={styles.miniPlant}><i /><i /><i /><b /></div></div>
            <span>02 · Living Green</span><h3>Ficus Study</h3><p>Layered leaves for quiet, bright corners.</p>
          </article>
          <article className={styles.product}>
            <div className={`${styles.productStage} ${styles.stageSand}`}><div className={styles.miniVase} /></div>
            <span>03 · Objects</span><h3>Dune Vessel</h3><p>A tactile ceramic form for shelves and tables.</p>
          </article>
        </div>
      </section>

      <section className={styles.trust} aria-label="Shopping benefits">
        <div><Truck /><span><strong>Pakistan-wide delivery</strong>From city apartments to family homes.</span></div>
        <div><ShieldCheck /><span><strong>Cash on Delivery</strong>A familiar launch payment experience.</span></div>
        <div><PackageCheck /><span><strong>Careful packing</strong>Objects prepared for safer transit.</span></div>
      </section>
    </main>
  );
}
