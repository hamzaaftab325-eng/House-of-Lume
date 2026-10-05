import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Headphones,
  PackageCheck,
  Play,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { HomeMotion } from "@/components/home/home-motion";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { env } from "@/lib/env";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Premium Lighting, Plants & Home Decor in Pakistan",
  description:
    "House of Lume curates premium lamps, living plants and timeless home decor for warmer modern homes across Pakistan. Cash on Delivery available.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "House of Lume — Homes That Inspire",
    description:
      "Premium lighting, living green and considered home decor for warmer homes across Pakistan.",
    url: "/",
    siteName: "House of Lume",
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "/images/house-of-lume/hero.webp",
        width: 1800,
        height: 1013,
        alt: "Warm House of Lume interior with sculptural lighting, plants and decor",
      },
    ],
  },
};

const categories = [
  {
    id: "lighting",
    title: "Lamps",
    copy: "Light that sets the mood",
    image: "/images/house-of-lume/lighting.webp",
    alt: "Warm brass table lamp in a styled House of Lume interior",
  },
  {
    id: "plants",
    title: "Plants",
    copy: "Bring nature home",
    image: "/images/house-of-lume/plants.webp",
    alt: "Lush indoor plant in a stone planter",
  },
  {
    id: "decor",
    title: "Home Decor",
    copy: "Details that make a difference",
    image: "/images/house-of-lume/decor.webp",
    alt: "Sculptural stone and ceramic home decor objects",
  },
  {
    id: "planters",
    title: "Planters",
    copy: "Beautiful homes, greener tomorrows",
    image: "/images/house-of-lume/planters.webp",
    alt: "Indoor greenery styled in a textured planter",
  },
] as const;

const featuredProducts = [
  { name: "Eclipse Table Lamp", meta: "House Edit" },
  { name: "Ribbed Lily Planter", meta: "House Edit" },
  { name: "Sculptural Vase", meta: "House Edit" },
  { name: "Terra Table Lamp", meta: "House Edit" },
] as const;

const rooms = [
  {
    title: "Living Room",
    image: "/images/house-of-lume/living.webp",
    alt: "Warm living room styled with House of Lume plants and lighting",
  },
  {
    title: "Bedroom",
    image: "/images/house-of-lume/bedroom.webp",
    alt: "Warm premium bedroom with ambient House of Lume lighting",
  },
  {
    title: "Dining Room",
    image: "/images/house-of-lume/dining.webp",
    alt: "Warm dining room with pendant lights, greenery and natural materials",
  },
  {
    title: "Workspace",
    image: "/images/house-of-lume/workspace.webp",
    alt: "Refined home workspace with warm light and greenery",
  },
] as const;

const materialTiles = [
  {
    title: "Natural Rattan",
    copy: "Handwoven by artisans",
    image: "/images/house-of-lume/lighting.webp",
    position: "rattan",
  },
  {
    title: "Solid Wood",
    copy: "Built to last",
    image: "/images/house-of-lume/workspace.webp",
    position: "wood",
  },
  {
    title: "Ceramics",
    copy: "Timeless & unique",
    image: "/images/house-of-lume/decor.webp",
    position: "ceramic",
  },
  {
    title: "Living Plants",
    copy: "Naturally better spaces",
    image: "/images/house-of-lume/plants.webp",
    position: "green",
  },
] as const;

const services = [
  { icon: Truck, title: "Cash on Delivery", copy: "Across Pakistan" },
  { icon: PackageCheck, title: "Easy Returns", copy: "Clear support process" },
  { icon: ShieldCheck, title: "Curated Quality", copy: "Considered pieces, selected well" },
  { icon: Headphones, title: "Dedicated Support", copy: "We’re here to help" },
] as const;

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${env.NEXT_PUBLIC_SITE_URL}/#organization`,
        name: "House of Lume",
        url: env.NEXT_PUBLIC_SITE_URL,
        description:
          "Premium lighting, living plants and timeless home decor for modern Pakistani homes.",
      },
      {
        "@type": "WebSite",
        "@id": `${env.NEXT_PUBLIC_SITE_URL}/#website`,
        url: env.NEXT_PUBLIC_SITE_URL,
        name: "House of Lume",
        publisher: { "@id": `${env.NEXT_PUBLIC_SITE_URL}/#organization` },
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
            src="/images/house-of-lume/hero.webp"
            alt="Warm sculptural House of Lume living room with brass lighting and greenery"
            fill
            priority
            sizes="100vw"
            quality={90}
          />
        </div>
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy} data-home-hero-copy>
            <p className={styles.eyebrow}>Pakistan&apos;s curated destination</p>
            <h1 id="home-title" className={styles.heroTitle}>
              Homes
              <span>That Inspire</span>
            </h1>
            <p className={styles.heroBody}>
              Premium lamps, lush plants and home decor pieces to create a more beautiful you.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href="#categories">
                Shop Collections <ArrowRight aria-hidden="true" />
              </Link>
              <Link className={styles.storyCta} href="#collection">
                <span className={styles.playButton} aria-hidden="true">
                  <Play />
                </span>
                Watch Our Story
              </Link>
            </div>
            <div className={styles.heroStats} aria-label="House of Lume service highlights">
              <div>
                <strong>Pakistan-wide</strong>
                <span>Delivery</span>
              </div>
              <div>
                <strong>PKR</strong>
                <span>Local pricing</span>
              </div>
              <div>
                <strong>COD</strong>
                <span>Cash on Delivery</span>
              </div>
            </div>
          </div>

          <div className={styles.heroRail} aria-hidden="true">
            <span>Lights</span>
            <span>Plants</span>
            <span>Decor</span>
            <span>A brighter</span>
            <span>Pakistan</span>
            <i />
          </div>
        </div>
      </section>

      <section className={styles.categories} id="categories" aria-labelledby="categories-title">
        <div className={styles.categoryIntro} data-home-reveal>
          <p className={styles.eyebrowDark}>Shop by category</p>
          <h2 id="categories-title">Curated for a More Beautiful Home</h2>
          <p>
            Explore our collections of lamps, plants and decor — thoughtfully chosen to bring
            warmth, character and calm into everyday spaces.
          </p>
          <Link className={styles.textLink} href="#featured">
            View All Collections <ArrowRight aria-hidden="true" />
          </Link>
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
                sizes="(max-width: 767px) 76vw, 19vw"
              />
              <div className={styles.categoryShade} aria-hidden="true" />
              <div className={styles.categoryContent}>
                <h3>{category.title}</h3>
                <p>{category.copy}</p>
                <Link href="#featured" aria-label={`Shop ${category.title}`}>
                  Shop Now <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.featured} id="featured" aria-labelledby="featured-title">
        <div className={styles.featuredMedia} data-home-parallax>
          <Image
            src="/images/house-of-lume/featured.webp"
            alt="Curated House of Lume lamp, planter, sculptural vase and table lamp on stone plinths"
            fill
            sizes="100vw"
          />
        </div>
        <div className={styles.featuredShade} aria-hidden="true" />
        <div className={styles.featuredInner}>
          <div className={styles.featuredCopy} data-home-reveal>
            <p className={styles.eyebrowLight}>Featured products</p>
            <h2 id="featured-title">
              Design Meets <span>Everyday Living</span>
            </h2>
            <p>Timeless pieces for homes that feel personal, peaceful and alive.</p>
            <Link className={styles.featuredLink} href="#collection">
              View All Products <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.productLabels} aria-label="Featured House of Lume products">
            {featuredProducts.map((product) => (
              <div className={styles.productLabel} key={product.name}>
                <strong>{product.name}</strong>
                <span>{product.meta}</span>
                <span className={styles.productAction} aria-hidden="true">
                  +
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.collection} id="collection" aria-labelledby="collection-title">
        <div className={styles.collectionMedia} data-home-parallax>
          <Image
            src="/images/house-of-lume/collection.webp"
            alt="Warm living room styled with House of Lume lighting, plants and objects"
            fill
            sizes="100vw"
          />
        </div>
        <div className={styles.collectionShade} aria-hidden="true" />
        <div className={styles.collectionCopy} data-home-reveal>
          <p className={styles.eyebrowLight}>The House of Lume collection</p>
          <h2 id="collection-title">Spaces with Soul</h2>
          <p>
            Thoughtfully designed pieces for modern Pakistani homes — where nature, art and light
            live together in perfect harmony.
          </p>
          <Link className={styles.primaryCta} href="#rooms">
            Explore the Collection <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <blockquote className={styles.collectionQuote}>
          “A home filled with light and living things is a kinder, brighter place to be.”
        </blockquote>
      </section>

      <section className={styles.rooms} id="rooms" aria-labelledby="rooms-title">
        <div className={styles.roomsHead} data-home-reveal>
          <div>
            <p className={styles.eyebrowLight}>Discover by room</p>
            <h2 id="rooms-title">Different Spaces. Brighter Stories.</h2>
          </div>
          <p>From cosy corners to open spaces, find inspiration for every room in your home.</p>
        </div>
        <div className={styles.roomGrid}>
          {rooms.map((room) => (
            <article className={styles.roomCard} key={room.title} data-home-reveal>
              <Image src={room.image} alt={room.alt} fill sizes="(max-width: 767px) 78vw, 24vw" />
              <div className={styles.roomShade} aria-hidden="true" />
              <div className={styles.roomContent}>
                <h3>{room.title}</h3>
                <Link href="#featured">
                  Shop Now <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.materials} id="materials" aria-labelledby="materials-title">
        <div className={styles.materialIntro} data-home-reveal>
          <p className={styles.eyebrowLight}>Craftsmanship &amp; quality</p>
          <h2 id="materials-title">Made to Last</h2>
          <p>
            From handcrafted ceramics to natural rattan, solid wood and lush greenery — we choose
            materials that are beautiful, durable and kind to your home and the planet.
          </p>
          <Link className={styles.featuredLink} href="#delivery">
            Learn More <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.materialGrid}>
          {materialTiles.map((material) => (
            <article className={styles.materialCard} key={material.title} data-home-reveal>
              <div className={styles.materialMedia} data-position={material.position}>
                <Image src={material.image} alt="" fill sizes="(max-width: 767px) 76vw, 18vw" />
              </div>
              <div>
                <h3>{material.title}</h3>
                <p>{material.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className={styles.serviceRail}
        id="delivery"
        aria-label="Shopping with House of Lume"
      >
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div className={styles.serviceItem} key={service.title}>
              <Icon aria-hidden="true" />
              <div>
                <strong>{service.title}</strong>
                <span>{service.copy}</span>
              </div>
            </div>
          );
        })}
      </section>

      <section className={styles.newsletter} aria-labelledby="newsletter-title">
        <div className={styles.newsletterMedia}>
          <Image
            src="/images/house-of-lume/living.webp"
            alt="Warm House of Lume interior with plants and ambient lighting"
            fill
            sizes="100vw"
          />
        </div>
        <div className={styles.newsletterShade} aria-hidden="true" />
        <div className={styles.newsletterInner}>
          <div data-home-reveal>
            <p className={styles.eyebrowLight}>Join House of Lume</p>
            <h2 id="newsletter-title">Be the First to Discover More Beautiful Living</h2>
            <p>New arrivals, styling ideas and thoughtful notes for a warmer home.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}
