import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  HandHeart,
  Headphones,
  Leaf,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import { TornDivider } from "@/components/editorial/torn-divider";
import { HomeMotion } from "@/components/home/home-motion";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { env } from "@/lib/env";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Lamps, Plants & Home Decor for Warmer Homes in Pakistan",
  description:
    "Discover House of Lume lighting, living plants and considered home decor for warmer modern homes across Pakistan. Cash on Delivery available.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "House of Lume — Light for Better Living",
    description: "Lighting, living green and considered objects for warmer homes across Pakistan.",
    url: "/",
    siteName: "House of Lume",
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "/images/house-of-lume/hero.webp",
        width: 1800,
        height: 1013,
        alt: "Warm House of Lume interior with sculptural lighting, greenery and natural materials",
      },
    ],
  },
};

const categories = [
  {
    id: "lighting",
    title: "Table Lamps",
    copy: "Warm pools of light for bedside, console and reading corners.",
    image: "/images/house-of-lume/lighting.webp",
    alt: "Warm brass table lamp in a styled interior",
  },
  {
    id: "floor-lamps",
    title: "Floor Lamps",
    copy: "Sculptural height and softer evening light.",
    image: "/images/house-of-lume/workspace.webp",
    alt: "Warm home workspace with considered lighting",
  },
  {
    id: "pendants",
    title: "Pendant Lights",
    copy: "Statement light for dining and gathering spaces.",
    image: "/images/house-of-lume/dining.webp",
    alt: "Dining space with warm pendant lighting",
  },
  {
    id: "plants",
    title: "Indoor Plants",
    copy: "Living green for calmer rooms and softer edges.",
    image: "/images/house-of-lume/plants.webp",
    alt: "Lush indoor plant in a textured stone planter",
  },
  {
    id: "planters",
    title: "Planters",
    copy: "Grounded vessels designed around living forms.",
    image: "/images/house-of-lume/planters.webp",
    alt: "Indoor greenery in a tactile planter",
  },
  {
    id: "decor",
    title: "Home Accents",
    copy: "Ceramic forms and objects that finish the room quietly.",
    image: "/images/house-of-lume/decor.webp",
    alt: "Sculptural ceramic and stone home decor objects",
  },
] as const;

const houseEdit = [
  { name: "Evening Light", meta: "Lighting edit" },
  { name: "Living Green", meta: "Plant edit" },
  { name: "Quiet Objects", meta: "Decor edit" },
  { name: "Natural Layers", meta: "Material edit" },
] as const;

const rooms = [
  {
    index: "01",
    title: "Living Room",
    subtitle: "Warm & Inviting",
    copy: "Layer ambient light, living green and tactile objects so the room feels settled rather than staged.",
    image: "/images/house-of-lume/living.webp",
    alt: "Warm living room with House of Lume lighting and greenery",
  },
  {
    index: "02",
    title: "Bedroom",
    subtitle: "Restful Retreats",
    copy: "Softer pools of light and quiet natural textures create a slower end to the day.",
    image: "/images/house-of-lume/bedroom.webp",
    alt: "Warm bedroom with soft ambient lighting",
  },
  {
    index: "03",
    title: "Dining Room",
    subtitle: "Gathered in Light",
    copy: "Bring the table into focus with overhead glow, grounded ceramics and easy greenery.",
    image: "/images/house-of-lume/dining.webp",
    alt: "Dining room with warm pendant lighting and plants",
  },
  {
    index: "04",
    title: "Workspace",
    subtitle: "Focused & Fresh",
    copy: "Task light, greenery and a few deliberate objects keep working spaces calm and useful.",
    image: "/images/house-of-lume/workspace.webp",
    alt: "Home workspace with warm light, plants and natural materials",
  },
] as const;

const materialNotes = [
  { title: "Ceramic Forms", copy: "Tactile surfaces and quiet silhouettes", icon: Sparkles },
  { title: "Warm Wood", copy: "Natural grain with visual weight", icon: PackageCheck },
  { title: "Living Green", copy: "Organic shape that softens a room", icon: Leaf },
  { title: "Considered Care", copy: "Pieces selected for everyday living", icon: HandHeart },
] as const;

const services = [
  { icon: Truck, title: "Pakistan-wide delivery", copy: "Delivery coverage across Pakistan" },
  { icon: ShieldCheck, title: "Cash on Delivery", copy: "Pay when your order arrives" },
  { icon: PackageCheck, title: "Carefully packed", copy: "Prepared for safer transit" },
  { icon: Headphones, title: "Human support", copy: "A House of Lume team to help" },
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
          "Lighting, living plants and considered home decor for modern Pakistani homes.",
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
            alt="Warm House of Lume interior with sculptural lighting, greenery and natural materials"
            fill
            priority
            sizes="100vw"
            quality={90}
          />
        </div>
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy} data-home-hero-copy>
            <p className={styles.eyebrowLight}>Pakistan&apos;s curated destination</p>
            <h1 id="home-title" className={styles.heroTitle}>
              Light for <em>Better Living</em>
            </h1>
            <p className={styles.heroBody}>
              Designer lighting, living green and thoughtful home styling for warmer, calmer rooms.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href="#categories">
                Explore the House <ArrowRight aria-hidden="true" />
              </Link>
              <Link className={styles.quietCta} href="#philosophy">
                Our philosophy <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.heroFacts} aria-label="House of Lume shopping highlights">
              <span>Pakistan-wide delivery</span>
              <span>Cash on Delivery</span>
              <span>Prices in PKR</span>
            </div>
          </div>
        </div>
        <TornDivider edge="bottom" variant="wide" />
      </section>

      <section className={styles.categories} id="categories" aria-labelledby="categories-title">
        <div className={styles.sectionIntro} data-home-reveal>
          <p className={styles.eyebrow}>Curated categories</p>
          <h2 id="categories-title">Find the pieces that change how a room feels.</h2>
          <p>
            Start with light, add living texture, then finish with objects that bring character
            without crowding the space.
          </p>
        </div>
        <div className={styles.categoryGrid}>
          {categories.map((category, index) => (
            <article
              className={styles.categoryCard}
              id={category.id}
              key={category.id}
              data-home-image
            >
              <Image
                src={category.image}
                alt={category.alt}
                fill
                sizes="(max-width: 767px) 78vw, (max-width: 1199px) 31vw, 16vw"
              />
              <div className={styles.cardShade} aria-hidden="true" />
              <div className={styles.categoryContent}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{category.title}</h3>
                <p>{category.copy}</p>
              </div>
            </article>
          ))}
        </div>
        <TornDivider edge="bottom" variant="fine" />
      </section>

      <section className={styles.featured} id="featured" aria-labelledby="featured-title">
        <div className={styles.featuredMedia} data-home-parallax>
          <Image
            src="/images/house-of-lume/featured.webp"
            alt="House of Lume editorial arrangement of lighting, greenery and sculptural objects"
            fill
            sizes="100vw"
          />
        </div>
        <div className={styles.featuredShade} aria-hidden="true" />
        <div className={styles.featuredInner}>
          <div className={styles.featuredCopy} data-home-reveal>
            <p className={styles.eyebrowLight}>The House Edit</p>
            <h2 id="featured-title">Design meets everyday living.</h2>
            <p>
              An editorial preview of the objects and moods shaping House of Lume. Purchasable
              products will appear here when the catalogue is published.
            </p>
          </div>
          <div className={styles.editRail} aria-label="House of Lume editorial collection preview">
            {houseEdit.map((item, index) => (
              <div className={styles.editItem} key={item.name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.name}</strong>
                <small>{item.meta}</small>
              </div>
            ))}
          </div>
        </div>
        <TornDivider edge="bottom" variant="rough" />
      </section>

      <section className={styles.philosophy} id="philosophy" aria-labelledby="philosophy-title">
        <div className={styles.philosophyMedia} data-home-image>
          <Image
            src="/images/house-of-lume/craftsmanship.webp"
            alt="Close material detail showing thoughtful making and natural texture"
            fill
            sizes="(max-width: 767px) 100vw, 52vw"
          />
        </div>
        <div className={styles.philosophyCopy} data-home-reveal>
          <p className={styles.eyebrow}>Our philosophy</p>
          <h2 id="philosophy-title">
            Beautiful homes. <em>Brighter tomorrows.</em>
          </h2>
          <p>
            We believe a well-lived home is built slowly: useful light, living green, tactile
            materials and objects chosen because they belong there.
          </p>
          <div className={styles.philosophyNotes}>
            {materialNotes.map((note) => {
              const Icon = note.icon;
              return (
                <div key={note.title}>
                  <Icon aria-hidden="true" />
                  <strong>{note.title}</strong>
                  <span>{note.copy}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.rooms} id="rooms" aria-labelledby="rooms-title">
        <div className={styles.roomsHeader} data-home-reveal>
          <div>
            <p className={styles.eyebrow}>Room inspiration</p>
            <h2 id="rooms-title">Homes that feel good.</h2>
          </div>
          <p>
            Four ways to layer light, greenery and objects without making the room feel overdone.
          </p>
        </div>
        <div className={styles.roomStack}>
          {rooms.map((room, index) => (
            <article
              className={styles.roomStory}
              data-reverse={index % 2 === 1}
              data-home-reveal
              key={room.title}
            >
              <div className={styles.roomMedia} data-home-image>
                <Image
                  src={room.image}
                  alt={room.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, 52vw"
                />
              </div>
              <div className={styles.roomCopy}>
                <span>{room.index}</span>
                <h3>
                  {room.title} <em>{room.subtitle}</em>
                </h3>
                <p>{room.copy}</p>
                <Link href="#categories">
                  Explore the mood <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <TornDivider edge="bottom" variant="wide" />
      </section>

      <section className={styles.greenStory} aria-labelledby="green-story-title">
        <div className={styles.greenMedia} data-home-parallax>
          <Image
            src="/images/house-of-lume/plants.webp"
            alt="Lush indoor greenery in a warm House of Lume interior"
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
          />
        </div>
        <div className={styles.greenCopy} data-home-reveal>
          <p className={styles.eyebrowLight}>Living green</p>
          <h2 id="green-story-title">
            More light. <em>More life.</em>
          </h2>
          <p>
            Plants introduce movement, softness and changing light. Pair them with grounded planters
            and warm illumination for rooms that feel naturally alive.
          </p>
          <Link href="#plants">
            Explore living green <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className={styles.serviceRail} aria-label="Shopping with House of Lume">
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
            src="/images/house-of-lume/collection.webp"
            alt="Warm House of Lume interior with layered light, plants and natural objects"
            fill
            sizes="100vw"
          />
        </div>
        <div className={styles.newsletterShade} aria-hidden="true" />
        <div className={styles.newsletterInner}>
          <div data-home-reveal>
            <p className={styles.eyebrowLight}>House notes</p>
            <h2 id="newsletter-title">Nourishing your home, one thoughtful layer at a time.</h2>
            <p>New arrivals, styling ideas and considered notes from House of Lume.</p>
          </div>
          <NewsletterForm />
        </div>
        <TornDivider edge="top" variant="fine" />
      </section>
    </main>
  );
}
