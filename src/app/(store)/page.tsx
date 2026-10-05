import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Banknote, Headphones, Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";

import {
  DemoLampArt,
  DemoObjectArt,
  DemoPlantArt,
  ProductUnit,
} from "@/components/editorial/editorial";
import { HomeMotion } from "@/components/home/home-motion";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { LumeButtonLink, LumeLink } from "@/components/ui/controls";
import { env } from "@/lib/env";
import { getHomepageProducts, type HomepageProduct } from "@/server/homepage";

import styles from "./page.module.css";

export const revalidate = 300;

const heroImage =
  "https://images.unsplash.com/photo-1772208392422-bb2f2609097a?auto=format&fit=crop&fm=jpg&q=84&w=2400";
const warmLivingImage =
  "https://images.unsplash.com/photo-1778766017582-44ba4512f532?auto=format&fit=crop&fm=jpg&q=82&w=2200";
const greenLivingImage =
  "https://images.unsplash.com/photo-1769366316790-dfcb6a546f05?auto=format&fit=crop&fm=jpg&q=82&w=1800";
const bedroomImage =
  "https://images.unsplash.com/photo-1764760764956-fcb78be107a5?auto=format&fit=crop&fm=jpg&q=82&w=1800";
const lightStudyImage =
  "https://images.unsplash.com/photo-1785741185813-452c276509de?auto=format&fit=crop&fm=jpg&q=82&w=1800";
const objectStudyImage =
  "https://images.unsplash.com/photo-1679945849643-6e52b7a7eccd?auto=format&fit=crop&fm=jpg&q=82&w=1800";

export const metadata: Metadata = {
  title: "Lighting, Plants & Considered Objects for Warmer Homes",
  description:
    "Discover House of Lume lighting, living green and considered home objects, curated for warmer spaces across Pakistan with Cash on Delivery at launch.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    title: "House of Lume — Objects for a warmer home",
    description:
      "Lighting, greenery and considered objects curated for warmer, lived-in spaces across Pakistan.",
    siteName: "House of Lume",
    url: "/",
    images: [
      {
        url: heroImage,
        width: 1600,
        height: 1000,
        alt: "Warm, considered living room with ambient lighting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "House of Lume — Objects for a warmer home",
    description: "Lighting, greenery and considered objects for warm, lived-in spaces.",
    images: [heroImage],
  },
};

const categories = [
  {
    id: "lighting",
    eyebrow: "01 · Lighting",
    title: "Light that changes how a room feels.",
    image: lightStudyImage,
    alt: "Warm floor lamp casting light across an interior wall",
  },
  {
    id: "living-green",
    eyebrow: "02 · Living Green",
    title: "A quieter rhythm, brought indoors.",
    image: greenLivingImage,
    alt: "Green plants in a warm modern living room",
  },
  {
    id: "objects",
    eyebrow: "03 · Objects",
    title: "Finishing pieces with presence.",
    image: objectStudyImage,
    alt: "Table with a lamp and potted plant in a warm interior",
  },
] as const;

const rooms = [
  {
    index: "01",
    title: "Living room",
    copy: "Ambient layers for the part of home that gathers everyone.",
    image: warmLivingImage,
    alt: "Warm living room with illuminated lamps and soft seating",
  },
  {
    index: "02",
    title: "Bedroom",
    copy: "Softer light and natural texture for slower evenings.",
    image: bedroomImage,
    alt: "Bedroom in warm evening light with a plant",
  },
  {
    index: "03",
    title: "Reading corner",
    copy: "Focused glow, greenery and objects that make a pause feel intentional.",
    image: lightStudyImage,
    alt: "Floor lamp and plant illuminated by a warm beam of light",
  },
  {
    index: "04",
    title: "Quiet corner",
    copy: "A small composition can change the atmosphere of an entire room.",
    image: objectStudyImage,
    alt: "Considered table vignette with lamp and greenery",
  },
] as const;

const trustItems = [
  {
    icon: Truck,
    title: "Pakistan-wide delivery",
    copy: "Built for nationwide fulfilment with clear delivery expectations.",
  },
  {
    icon: Banknote,
    title: "Cash on Delivery",
    copy: "A familiar payment experience, intentionally designed for launch.",
  },
  {
    icon: ShieldCheck,
    title: "Verified orders",
    copy: "WhatsApp and admin verification support a cleaner COD workflow.",
  },
  {
    icon: Headphones,
    title: "Human support",
    copy: "Real order visibility and accountable after-sales support.",
  },
] as const;

function ProductArtwork({ type }: { type: HomepageProduct["productType"] }) {
  if (type === "plant" || type === "planter") return <DemoPlantArt />;
  if (type === "lamp" || type === "candle") return <DemoLampArt />;
  return <DemoObjectArt />;
}

function productTone(type: HomepageProduct["productType"]) {
  if (type === "plant" || type === "planter") return "olive" as const;
  if (type === "lamp" || type === "candle") return "paper" as const;
  return "chalk" as const;
}

export default async function StorefrontHomePage() {
  const products = await getHomepageProducts(4);
  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "House of Lume",
        url: siteUrl,
        areaServed: {
          "@type": "Country",
          name: "Pakistan",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "House of Lume",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        inLanguage: "en-PK",
      },
    ],
  };

  return (
    <main className={styles.page}>
      <HomeMotion />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <section className={styles.heroShell} aria-label="House of Lume introduction">
        <div className={styles.hero} data-home-hero aria-labelledby="home-title">
          <div className={styles.heroMedia} data-home-hero-media>
            <Image
              src={heroImage}
              alt="Warm living room with soft furnishings, natural materials and ambient light"
              fill
              priority
              sizes="100vw"
              quality={88}
            />
          </div>
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.heroGlow} aria-hidden="true" />

          <div className={styles.heroInner} data-home-hero-copy>
            <div className={styles.heroCopy}>
              <div className={styles.heroEyebrowRow}>
                <p className={styles.kicker}>House of Lume · Pakistan</p>
                <span>Curated interiors / 2026</span>
              </div>
              <h1 className={styles.heroTitle} id="home-title">
                Objects for a warmer home.
              </h1>
              <p className={styles.heroBody}>
                Thoughtfully selected lighting, living green and sculptural objects for rooms that
                feel calm, tactile and genuinely lived in.
              </p>
              <div className={styles.heroActions}>
                <LumeButtonLink href="/#collections" showArrow>
                  Explore the house
                </LumeButtonLink>
                <LumeLink href="/#story">Our point of view</LumeLink>
              </div>
            </div>

            <aside className={styles.heroAside} aria-label="House of Lume edit">
              <p>The House Edit</p>
              <div>
                <span>01</span>
                <strong>Lighting</strong>
              </div>
              <div>
                <span>02</span>
                <strong>Living Green</strong>
              </div>
              <div>
                <span>03</span>
                <strong>Objects</strong>
              </div>
            </aside>

            <div className={styles.heroFacts} aria-label="House of Lume service highlights">
              <div>
                <span>01</span>
                <strong>PKR pricing</strong>
                <small>Local, clear and direct</small>
              </div>
              <div>
                <span>02</span>
                <strong>Cash on Delivery</strong>
                <small>Built for launch</small>
              </div>
              <div>
                <span>03</span>
                <strong>Pakistan-wide</strong>
                <small>Nationwide delivery</small>
              </div>
              <div>
                <span>04</span>
                <strong>Curated edit</strong>
                <small>Less noise, better objects</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.collections} id="collections" aria-labelledby="collections-title">
        <div className="site-shell">
          <div className={styles.sectionHeading} data-home-reveal>
            <div>
              <p className={styles.kicker}>01 / The Collection</p>
              <h2 id="collections-title">Three ways to change the room.</h2>
            </div>
            <p>
              Start with the feeling, not the checklist. Softer light, living greenery and objects
              with enough presence to hold their own.
            </p>
          </div>

          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <article
                className={styles.categoryCard}
                id={category.id}
                key={category.id}
                data-home-reveal
              >
                <Image
                  src={category.image}
                  alt={category.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, 60vw"
                />
                <div className={styles.categoryShade} aria-hidden="true" />
                <div className={styles.categoryIndex}>{category.eyebrow}</div>
                <div className={styles.categoryCopy}>
                  <h3>{category.title}</h3>
                  <Link href="/#featured" className={styles.categoryLink}>
                    Explore collection
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.featured} id="featured" aria-labelledby="featured-title">
        <div className="site-shell">
          <div className={styles.featuredHeader} data-home-reveal>
            <div>
              <p className={styles.kicker}>02 / The House Edit</p>
              <h2 id="featured-title">Chosen for atmosphere, not excess.</h2>
            </div>
            <p>
              A smaller, sharper collection of objects that earn their place through material,
              silhouette, light and usefulness.
            </p>
          </div>

          {products.length > 0 ? (
            <div className={styles.productShelf}>
              {products.map((product, index) => (
                <ProductUnit
                  key={product.id}
                  index={String(index + 1).padStart(2, "0")}
                  name={product.name}
                  context={product.description}
                  price={product.priceLabel}
                  label={product.productType.replaceAll("_", " ")}
                  tone={productTone(product.productType)}
                >
                  <ProductArtwork type={product.productType} />
                </ProductUnit>
              ))}
            </div>
          ) : (
            <div className={styles.catalogEmpty} data-home-reveal>
              <div className={styles.catalogEmptyMark}>HL</div>
              <div>
                <p className={styles.catalogEyebrow}>The first House Edit</p>
                <h3>A considered collection is arriving soon.</h3>
              </div>
              <p>
                We are preparing the first sellable edit now. The page is ready for live catalogue
                products as soon as they are published.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className={styles.story} id="story" aria-labelledby="story-title">
        <div className={styles.storyMedia} data-home-parallax>
          <Image
            src={warmLivingImage}
            alt="Warm living room with lamps and natural textures"
            fill
            sizes="(max-width: 767px) 100vw, 58vw"
          />
          <div className={styles.storyCaption}>
            <span>House study 01</span>
            <span>Light / texture / quiet</span>
          </div>
        </div>
        <div className={styles.storyCopy} data-home-reveal>
          <p className={styles.kicker}>03 / Our point of view</p>
          <h2 id="story-title">Rooms should feel collected, not filled.</h2>
          <p>
            A good room is a balance of light, texture, greenery and breathing space. House of Lume
            is built around that balance—so every object has a reason to be there.
          </p>
          <blockquote>
            “The goal is not more. The goal is a room that feels more like you.”
          </blockquote>
          <div className={styles.storyNotes}>
            <span>
              <Leaf aria-hidden="true" /> Natural materials
            </span>
            <span>
              <Sparkles aria-hidden="true" /> Intentional light
            </span>
          </div>
          <LumeLink href="/#spaces">Explore the rooms</LumeLink>
        </div>
      </section>

      <section className={styles.spaces} id="spaces" aria-labelledby="spaces-title">
        <div className="site-shell">
          <div className={styles.centerHeading} data-home-reveal>
            <p className={styles.kicker}>04 / Room stories</p>
            <h2 id="spaces-title">Shop the mood, not the checklist.</h2>
            <p>
              Different rooms ask for different kinds of warmth. Start with atmosphere, then layer
              in the objects that make it yours.
            </p>
          </div>

          <div className={styles.roomGrid}>
            {rooms.map((room) => (
              <article className={styles.roomCard} key={room.title} data-home-reveal>
                <div className={styles.roomImage}>
                  <Image
                    src={room.image}
                    alt={room.alt}
                    fill
                    sizes="(max-width: 767px) 92vw, 50vw"
                  />
                  <span className={styles.roomIndex}>{room.index}</span>
                </div>
                <div className={styles.roomCopy}>
                  <h3>{room.title}</h3>
                  <p>{room.copy}</p>
                  <span aria-hidden="true">View mood ↗</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.materials} aria-labelledby="materials-title">
        <div className="site-shell">
          <div className={styles.materialGrid}>
            <div className={styles.materialCopy} data-home-reveal>
              <p className={styles.kicker}>05 / Material language</p>
              <h2 id="materials-title">Warmth lives in the details.</h2>
              <p>
                Stone, ceramic, brushed metal, linen and plant texture all hold light differently.
                Our visual language keeps those differences visible rather than flattening
                everything into one generic product treatment.
              </p>
              <div className={styles.materialList} aria-label="Material principles">
                <span>01 · Honest texture</span>
                <span>02 · Warm reflection</span>
                <span>03 · Natural contrast</span>
              </div>
              <LumeLink href="/#journal">Read the House Notes</LumeLink>
            </div>

            <div className={styles.materialMosaic} data-home-reveal>
              <div className={styles.materialLarge}>
                <Image
                  src={lightStudyImage}
                  alt="Warm light across a lamp and plant"
                  fill
                  sizes="50vw"
                />
              </div>
              <div className={styles.materialSmall}>
                <Image
                  src={objectStudyImage}
                  alt="Lamp and plant study in a textured interior"
                  fill
                  sizes="25vw"
                />
              </div>
              <div className={styles.materialLabel}>
                <span>Light</span>
                <span>Plant</span>
                <span>Object</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.trust} id="delivery" aria-label="Service commitments">
        <div className="site-shell">
          <div className={styles.trustLead} data-home-reveal>
            <p className={styles.kicker}>06 / Designed for Pakistan</p>
            <h2>Beautiful on the surface. Practical underneath.</h2>
          </div>
          <div className={styles.trustGrid}>
            {trustItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className={styles.trustItem} data-home-reveal>
                  <div className={styles.trustIcon}>
                    <Icon aria-hidden="true" />
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.journal} id="journal" aria-labelledby="journal-title">
        <div className="site-shell">
          <div className={styles.journalLead} data-home-reveal>
            <p className={styles.kicker}>07 / House Notes</p>
            <blockquote id="journal-title">
              “Beautiful rooms rarely shout. They hold your attention quietly.”
            </blockquote>
            <p>
              Notes on lighting, greenery, material choices and the small decisions that make home
              feel more personal.
            </p>
          </div>

          <div className={styles.journalGrid}>
            <article data-home-reveal>
              <Image
                src={bedroomImage}
                alt="Warm bedroom in soft natural light"
                fill
                sizes="(max-width: 767px) 100vw, 42vw"
              />
              <div>
                <span>01 · Light</span>
                <h3>Building a softer evening light plan</h3>
              </div>
            </article>
            <article data-home-reveal>
              <Image
                src={greenLivingImage}
                alt="Greenery arranged in a warm living room"
                fill
                sizes="(max-width: 767px) 100vw, 29vw"
              />
              <div>
                <span>02 · Green</span>
                <h3>Living green without visual clutter</h3>
              </div>
            </article>
            <article data-home-reveal>
              <Image
                src={objectStudyImage}
                alt="Small interior vignette with lamp and plant"
                fill
                sizes="(max-width: 767px) 100vw, 29vw"
              />
              <div>
                <span>03 · Objects</span>
                <h3>Why one considered object can be enough</h3>
              </div>
            </article>
          </div>

          <div className={styles.newsletter} data-home-reveal>
            <div>
              <p className={styles.kicker}>Stay inside the House</p>
              <h2>New edits, useful room notes and quieter inspiration.</h2>
              <p>
                Occasional notes only—new collections, practical styling ideas and thoughtful
                product stories.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </main>
  );
}
