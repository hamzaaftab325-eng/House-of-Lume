import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Banknote, Headphones, ShieldCheck, Truck } from "lucide-react";

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
    number: "01",
    label: "Lighting",
    title: "Light that changes how a room feels.",
    copy: "A room can be furnished and still feel unfinished. The right light gives it rhythm, depth and somewhere for the eye to rest.",
    image: lightStudyImage,
    alt: "Warm floor lamp casting light across an interior wall",
  },
  {
    id: "living-green",
    number: "02",
    label: "Living Green",
    title: "A quieter rhythm, brought indoors.",
    copy: "Greenery softens hard edges, introduces movement and makes a room feel lived in without asking for more decoration.",
    image: greenLivingImage,
    alt: "Green plants in a warm modern living room",
  },
  {
    id: "objects",
    number: "03",
    label: "Objects",
    title: "Finishing pieces with presence.",
    copy: "Not fillers. Not clutter. Just a few useful, tactile objects that give the room character when everything else is quiet.",
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
    copy: "Nationwide fulfilment with clear delivery expectations before you order.",
  },
  {
    icon: Banknote,
    title: "Cash on Delivery",
    copy: "A familiar payment path designed deliberately for the way people shop locally.",
  },
  {
    icon: ShieldCheck,
    title: "Verified orders",
    copy: "Operational verification helps keep COD orders clean and fulfilment accountable.",
  },
  {
    icon: Headphones,
    title: "Human support",
    copy: "Order visibility and after-sales support are part of the experience, not an afterthought.",
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
        <div className={styles.heroVeil} aria-hidden="true" />
        <div className={styles.heroRule} data-lume-line aria-hidden="true" />

        <div className={styles.heroFrame} data-home-hero-copy>
          <div className={styles.heroIssue}>
            <span>House of Lume</span>
            <span>Pakistan · 2026</span>
          </div>

          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>A house shaped by light</p>
            <h1 className={styles.heroTitle} id="home-title" data-home-heading>
              Objects for a warmer home.
            </h1>
            <p className={styles.heroBody}>
              Lighting, living green and considered objects selected for rooms that feel calm,
              tactile and genuinely lived in.
            </p>
            <div className={styles.heroActions}>
              <LumeButtonLink href="/#collections" showArrow>
                Enter the collection
              </LumeButtonLink>
              <LumeLink href="/#story">Read our point of view</LumeLink>
            </div>
          </div>

          <div className={styles.heroFoot}>
            <span>PKR pricing</span>
            <span>Cash on Delivery</span>
            <span>Pakistan-wide delivery</span>
          </div>
        </div>
      </section>

      <section className={styles.intro} aria-label="House of Lume philosophy">
        <div className={styles.introGrid}>
          <div className={styles.introLabel} data-home-reveal>
            <span>House note / 001</span>
            <span className={styles.introLine} data-lume-line aria-hidden="true" />
          </div>

          <div className={styles.introStatement} data-home-reveal>
            <p>
              A room does not become personal because it contains more. It becomes personal when
              light, material and useful objects begin to belong to one another.
            </p>
          </div>

          <div className={styles.introImage} data-home-parallax>
            <Image
              src={lightStudyImage}
              alt="Warm pool of light across an interior surface"
              fill
              sizes="(max-width: 767px) 72vw, 24vw"
            />
          </div>
        </div>
      </section>

      <section className={styles.collections} id="collections" aria-labelledby="collections-title">
        <header className={styles.collectionsHeader} data-home-reveal>
          <p className={styles.eyebrow}>The collection</p>
          <h2 id="collections-title" data-home-heading>
            Three ways to change the room.
          </h2>
          <p>
            Start with the atmosphere you want to create. The objects come after.
          </p>
        </header>

        <div className={styles.chapterList}>
          {categories.map((category) => (
            <article
              className={styles.chapter}
              id={category.id}
              key={category.id}
              data-home-reveal
            >
              <div className={styles.chapterMeta}>
                <span>{category.number}</span>
                <p>{category.label}</p>
              </div>

              <div className={styles.chapterImage} data-home-image>
                <Image
                  src={category.image}
                  alt={category.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, 58vw"
                />
              </div>

              <div className={styles.chapterCopy}>
                <h3>{category.title}</h3>
                <p>{category.copy}</p>
                <Link href="/#featured" className={styles.chapterLink}>
                  Explore {category.label.toLowerCase()}
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.featured} id="featured" aria-labelledby="featured-title">
        <div className={styles.featuredTop}>
          <div data-home-reveal>
            <p className={styles.eyebrow}>The House Edit</p>
            <h2 id="featured-title" data-home-heading>
              Chosen for atmosphere, not excess.
            </h2>
          </div>
          <p data-home-reveal>
            A deliberately small edit of useful, tactile objects. No endless catalogue. No filler.
          </p>
        </div>

        <div className={styles.featuredRule} data-lume-line aria-hidden="true" />

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
            <span className={styles.catalogMonogram}>HL</span>
            <div>
              <p>The first House Edit</p>
              <h3>A considered collection is arriving soon.</h3>
            </div>
            <p>
              The live catalogue is connected. As products are published, this shelf will populate
              without changing the editorial structure around it.
            </p>
          </div>
        )}
      </section>

      <section className={styles.story} id="story" aria-labelledby="story-title">
        <div className={styles.storyMedia} data-home-parallax>
          <Image
            src={warmLivingImage}
            alt="Warm living room with lamps and natural textures"
            fill
            sizes="100vw"
          />
        </div>
        <div className={styles.storyShade} aria-hidden="true" />
        <div className={styles.storyFrame}>
          <div className={styles.storyIndex} data-home-reveal>
            <span>Point of view</span>
            <span>02 / 07</span>
          </div>
          <div className={styles.storyCopy} data-home-reveal>
            <p className={styles.eyebrow}>The House of Lume idea</p>
            <h2 id="story-title" data-home-heading>
              Rooms should feel collected, not filled.
            </h2>
            <p>
              We care about the relationship between things: where a lamp throws light, where a
              plant interrupts a hard edge, where one object earns the empty space around it.
            </p>
            <blockquote>“The goal is not more. The goal is enough, placed well.”</blockquote>
          </div>
        </div>
      </section>

      <section className={styles.spaces} id="spaces" aria-labelledby="spaces-title">
        <div className={styles.spacesLead} data-home-reveal>
          <p className={styles.eyebrow}>Room studies</p>
          <h2 id="spaces-title" data-home-heading>
            Shop the mood, not the checklist.
          </h2>
          <p>
            Each room asks for a different kind of warmth. These are starting points, not formulas.
          </p>
        </div>

        <div className={styles.roomRows}>
          {rooms.map((room) => (
            <article className={styles.roomRow} key={room.title} data-home-reveal>
              <div className={styles.roomNumber}>{room.index}</div>
              <div className={styles.roomTitle}>
                <h3>{room.title}</h3>
              </div>
              <div className={styles.roomImage} data-home-image>
                <Image
                  src={room.image}
                  alt={room.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, 45vw"
                />
              </div>
              <div className={styles.roomCopy}>
                <p>{room.copy}</p>
                <span aria-hidden="true">View study ↗</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.materials} aria-labelledby="materials-title">
        <div className={styles.materialBackdrop} aria-hidden="true">Material</div>
        <div className={styles.materialGrid}>
          <div className={styles.materialCopy} data-home-reveal>
            <p className={styles.eyebrow}>Material language</p>
            <h2 id="materials-title" data-home-heading>
              Warmth lives in what light touches.
            </h2>
            <p>
              Linen absorbs it. Ceramic holds it. Metal throws it back. Leaves break it apart.
              Those differences are the point.
            </p>
            <LumeLink href="/#journal">Read the House Notes</LumeLink>
          </div>

          <div className={styles.materialComposition}>
            <div className={styles.materialTall} data-home-parallax>
              <Image
                src={lightStudyImage}
                alt="Warm light across a lamp and plant"
                fill
                sizes="(max-width: 767px) 62vw, 34vw"
              />
            </div>
            <div className={styles.materialWide} data-home-reveal>
              <Image
                src={objectStudyImage}
                alt="Lamp and plant study in a textured interior"
                fill
                sizes="(max-width: 767px) 70vw, 30vw"
              />
            </div>
            <div className={styles.materialLegend}>
              <span>01 / Light</span>
              <span>02 / Plant</span>
              <span>03 / Object</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.trust} id="delivery" aria-labelledby="delivery-title">
        <div className={styles.trustIntro} data-home-reveal>
          <p className={styles.eyebrow}>Designed for Pakistan</p>
          <h2 id="delivery-title">Quiet design. Clear service.</h2>
          <p>
            The visual experience can be expressive. Ordering should be simple, familiar and easy
            to understand.
          </p>
        </div>

        <div className={styles.serviceList}>
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <article className={styles.serviceRow} key={item.title} data-home-reveal>
                <span className={styles.serviceNumber}>{String(index + 1).padStart(2, "0")}</span>
                <Icon aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.journal} id="journal" aria-labelledby="journal-title">
        <div className={styles.journalLead} data-home-reveal>
          <p className={styles.eyebrow}>House Notes</p>
          <h2 id="journal-title" data-home-heading>
            Ideas for living with less noise.
          </h2>
        </div>

        <div className={styles.journalFeature}>
          <div className={styles.journalImage} data-home-parallax>
            <Image
              src={bedroomImage}
              alt="Warm bedroom in soft natural light"
              fill
              sizes="(max-width: 767px) 100vw, 58vw"
            />
          </div>
          <div className={styles.journalFeatureCopy} data-home-reveal>
            <span>01 / Light</span>
            <h3>Building a softer evening light plan</h3>
            <p>
              A practical note on layering ambient, task and accent light without making the room
              feel over-designed.
            </p>
          </div>
        </div>

        <div className={styles.journalList}>
          <article data-home-reveal>
            <span>02 / Green</span>
            <h3>Living green without visual clutter</h3>
            <p>Use scale, repetition and empty space to let plants feel architectural.</p>
          </article>
          <article data-home-reveal>
            <span>03 / Objects</span>
            <h3>Why one considered object can be enough</h3>
            <p>The strongest styling move is often deciding what not to add.</p>
          </article>
        </div>

        <div className={styles.newsletter} data-home-reveal>
          <div>
            <p className={styles.eyebrow}>Stay inside the House</p>
            <h2>New edits, useful room notes and quieter inspiration.</h2>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}
