import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Banknote,
  Headphones,
  Leaf,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

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
import {
  getHomepageProducts,
  type HomepageProduct,
} from "@/server/homepage";

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
    description:
      "Lighting, greenery and considered objects for warm, lived-in spaces.",
    images: [heroImage],
  },
};

const categories = [
  {
    id: "lighting",
    eyebrow: "Lighting",
    title: "Light that changes how a room feels.",
    image: lightStudyImage,
    alt: "Warm floor lamp casting light across an interior wall",
  },
  {
    id: "living-green",
    eyebrow: "Living Green",
    title: "Bring a quieter rhythm indoors.",
    image: greenLivingImage,
    alt: "Green plants in a warm modern living room",
  },
  {
    id: "objects",
    eyebrow: "Objects",
    title: "Finishing pieces with purpose.",
    image: objectStudyImage,
    alt: "Table with a lamp and potted plant in a warm interior",
  },
] as const;

const rooms = [
  {
    title: "Living room",
    copy: "Ambient layers for the part of home that gathers everyone.",
    image: warmLivingImage,
    alt: "Warm living room with illuminated lamps and soft seating",
  },
  {
    title: "Bedroom",
    copy: "Softer light and natural texture for slower evenings.",
    image: bedroomImage,
    alt: "Bedroom in warm evening light with a plant",
  },
  {
    title: "Reading corner",
    copy: "Focused glow, greenery and objects that make a pause feel intentional.",
    image: lightStudyImage,
    alt: "Floor lamp and plant illuminated by a warm beam of light",
  },
  {
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
    copy: "A configurable nationwide delivery model built for local fulfilment.",
  },
  {
    icon: Banknote,
    title: "Cash on Delivery",
    copy: "COD is the only payment path at launch—clear, familiar and intentional.",
  },
  {
    icon: ShieldCheck,
    title: "Order verification",
    copy: "WhatsApp and admin verification are built into the operational model.",
  },
  {
    icon: Headphones,
    title: "Human support",
    copy: "Order and after-sales workflows are designed around accountable service.",
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

      <section className={styles.hero} data-home-hero aria-labelledby="home-title">
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
        <div className={styles.heroInner} data-home-hero-copy>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Elevate everyday living</p>
            <h1 className={styles.heroTitle} id="home-title">
              Objects for a warmer home.
            </h1>
            <p className={styles.heroBody}>
              Thoughtfully considered lighting, living green and objects for rooms that feel calm,
              tactile and genuinely lived in.
            </p>
            <div className={styles.heroActions}>
              <LumeButtonLink href="/#collections" showArrow>
                Shop the collection
              </LumeButtonLink>
              <LumeLink href="/#story">Discover our story</LumeLink>
            </div>
          </div>
          <div className={styles.heroFacts} aria-label="House of Lume service highlights">
            <div>
              <strong>PKR</strong>
              <span>Local pricing</span>
            </div>
            <div>
              <strong>COD</strong>
              <span>At launch</span>
            </div>
            <div>
              <strong>Pakistan</strong>
              <span>Nationwide delivery</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.collections} id="collections" aria-labelledby="collections-title">
        <div className="site-shell">
          <div className={styles.sectionHeading} data-home-reveal>
            <div>
              <p className={styles.kicker}>Shop by category</p>
              <h2 id="collections-title">Curated for every corner of your home.</h2>
            </div>
            <p>
              Three starting points, one material language: softer light, living greenery and
              objects that make a room feel considered.
            </p>
          </div>
          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <article className={styles.categoryCard} id={category.id} key={category.id} data-home-reveal>
                <Image
                  src={category.image}
                  alt={category.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, 33vw"
                />
                <div className={styles.categoryShade} aria-hidden="true" />
                <div className={styles.categoryCopy}>
                  <p>{category.eyebrow}</p>
                  <h3>{category.title}</h3>
                  <Link href="/#featured" className={styles.categoryLink}>
                    Explore
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
              <p className={styles.kicker}>Featured collection</p>
              <h2 id="featured-title">Objects chosen for atmosphere, not excess.</h2>
            </div>
            <p>
              This shelf is connected to the live House of Lume catalogue. Published products will
              appear here automatically as the collection is populated.
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
              <div>
                <Sparkles aria-hidden="true" />
                <p className={styles.catalogEyebrow}>Catalogue connected</p>
                <h3>The first sellable collection is being prepared.</h3>
              </div>
              <p>
                No fake products or invented prices are shown. As soon as a product is published in
                Supabase, it can enter this shelf without changing the homepage layout.
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
            sizes="(max-width: 767px) 100vw, 55vw"
          />
        </div>
        <div className={styles.storyCopy} data-home-reveal>
          <p className={styles.kicker}>The House of Lume point of view</p>
          <h2 id="story-title">More than objects. A calmer way of living.</h2>
          <p>
            A good room is not a catalogue of things. It is a balance of light, texture, greenery and
            space. House of Lume is designed around that balance—so each object earns its place.
          </p>
          <div className={styles.storyNotes}>
            <span><Leaf aria-hidden="true" /> Natural materials</span>
            <span><Sparkles aria-hidden="true" /> Intentional light</span>
          </div>
          <LumeLink href="/#spaces">Explore spaces</LumeLink>
        </div>
      </section>

      <section className={styles.spaces} id="spaces" aria-labelledby="spaces-title">
        <div className="site-shell">
          <div className={styles.centerHeading} data-home-reveal>
            <p className={styles.kicker}>Room discovery</p>
            <h2 id="spaces-title">Inspiration for real spaces.</h2>
            <p>See how light, plants and objects work together instead of competing for attention.</p>
          </div>
          <div className={styles.roomGrid}>
            {rooms.map((room) => (
              <article className={styles.roomCard} key={room.title} data-home-reveal>
                <div className={styles.roomImage}>
                  <Image src={room.image} alt={room.alt} fill sizes="(max-width: 767px) 85vw, 25vw" />
                </div>
                <div className={styles.roomCopy}>
                  <h3>{room.title}</h3>
                  <p>{room.copy}</p>
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
              <p className={styles.kicker}>Material story</p>
              <h2 id="materials-title">Designed around what light touches.</h2>
              <p>
                Stone, ceramic, plant texture, brushed metal and linen respond differently through
                the day. Our visual language keeps those differences visible instead of flattening
                every product into the same card treatment.
              </p>
              <LumeLink href="/#journal">Read the House Notes</LumeLink>
            </div>
            <div className={styles.materialMosaic} data-home-reveal>
              <div className={styles.materialLarge}>
                <Image src={lightStudyImage} alt="Warm light across a lamp and plant" fill sizes="50vw" />
              </div>
              <div className={styles.materialSmall}>
                <Image src={objectStudyImage} alt="Lamp and plant study in a textured interior" fill sizes="25vw" />
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
          <div className={styles.trustGrid}>
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className={styles.trustItem} data-home-reveal>
                  <Icon aria-hidden="true" />
                  <div>
                    <h2>{item.title}</h2>
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
            <p className={styles.kicker}>House Notes</p>
            <blockquote id="journal-title">“Beautiful design has a way of slowing things down.”</blockquote>
            <p>
              Notes on warmer lighting, calmer greenery, material choices and the small decisions
              that make home feel more personal.
            </p>
          </div>
          <div className={styles.journalGrid}>
            <article data-home-reveal>
              <Image src={bedroomImage} alt="Warm bedroom in soft natural light" fill sizes="33vw" />
              <div><span>01</span><h3>Building a softer evening light plan</h3></div>
            </article>
            <article data-home-reveal>
              <Image src={greenLivingImage} alt="Greenery arranged in a warm living room" fill sizes="33vw" />
              <div><span>02</span><h3>Living green without visual clutter</h3></div>
            </article>
            <article data-home-reveal>
              <Image src={objectStudyImage} alt="Small interior vignette with lamp and plant" fill sizes="33vw" />
              <div><span>03</span><h3>Why one considered object can be enough</h3></div>
            </article>
          </div>
          <div className={styles.newsletter} data-home-reveal>
            <div>
              <p className={styles.kicker}>Join the House of Lume journal</p>
              <h2>New collections, useful room notes and quieter inspiration.</h2>
              <p>Your email is stored privately and is never exposed through the public catalogue API.</p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </main>
  );
}
