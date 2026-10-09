import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Headphones,
  Leaf,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { HomeMotion } from "@/components/home/home-motion";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { env } from "@/lib/env";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Lamps, Plants & Home Decor for Modern Homes in Pakistan",
  description:
    "Discover House of Lume lighting, living plants and considered home decor for modern homes across Pakistan. Cash on Delivery available.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "House of Lume — A Brighter, Kinder Home",
    description:
      "Thoughtfully curated lighting, living green and home decor for modern homes across Pakistan.",
    url: "/",
    siteName: "House of Lume",
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "/images/house-of-lume/lighting.webp",
        width: 1200,
        height: 900,
        alt: "House of Lume sculptural lighting in a considered interior",
      },
    ],
  },
};

const categories = [
  {
    id: "lighting",
    title: "Lamps",
    copy: "Light for every mood",
    image: "/images/house-of-lume/lighting.webp",
    alt: "Warm sculptural table lamp in a considered House of Lume interior",
    tone: "blue",
  },
  {
    id: "plants",
    title: "Plants",
    copy: "Greener rooms, softer edges",
    image: "/images/house-of-lume/plants.webp",
    alt: "Lush indoor plant in a tactile planter",
    tone: "sage",
  },
  {
    id: "planters",
    title: "Planters",
    copy: "Grounded homes for living green",
    image: "/images/house-of-lume/planters.webp",
    alt: "Textured House of Lume planter with indoor greenery",
    tone: "sand",
  },
  {
    id: "decor",
    title: "Home Décor",
    copy: "Objects with meaning",
    image: "/images/house-of-lume/decor.webp",
    alt: "Sculptural ceramic home decor objects",
    tone: "clay",
  },
] as const;

const editorialPicks = [
  {
    index: "01",
    name: "Soft Light",
    type: "Lighting edit",
    image: "/images/house-of-lume/lighting.webp",
    alt: "House of Lume lighting edit",
  },
  {
    index: "02",
    name: "Living Form",
    type: "Plant edit",
    image: "/images/house-of-lume/plants.webp",
    alt: "House of Lume plant edit",
  },
  {
    index: "03",
    name: "Quiet Vessel",
    type: "Planter edit",
    image: "/images/house-of-lume/planters.webp",
    alt: "House of Lume planter edit",
  },
  {
    index: "04",
    name: "Sculptural Object",
    type: "Decor edit",
    image: "/images/house-of-lume/decor.webp",
    alt: "House of Lume decorative object edit",
  },
  {
    index: "05",
    name: "Working Light",
    type: "Workspace edit",
    image: "/images/house-of-lume/workspace.webp",
    alt: "House of Lume workspace lighting edit",
  },
] as const;

const spaces = [
  {
    title: "Calm corners",
    label: "Living room",
    image: "/images/house-of-lume/living.webp",
    alt: "Calm living room layered with light and greenery",
  },
  {
    title: "Better bedrooms",
    label: "Bedroom",
    image: "/images/house-of-lume/bedroom.webp",
    alt: "Quiet bedroom with warm bedside light",
  },
  {
    title: "Gathered light",
    label: "Dining room",
    image: "/images/house-of-lume/dining.webp",
    alt: "Dining room shaped by warm overhead light",
  },
  {
    title: "Focused ease",
    label: "Workspace",
    image: "/images/house-of-lume/workspace.webp",
    alt: "Home workspace with plants and considered lighting",
  },
] as const;

const materials = [
  {
    index: "01",
    title: "Ceramic",
    copy: "Tactile and enduring",
    image: "/images/house-of-lume/decor.webp",
    alt: "Textured ceramic surface",
  },
  {
    index: "02",
    title: "Wood",
    copy: "Warm and grounded",
    image: "/images/house-of-lume/craftsmanship.webp",
    alt: "Natural craft and wood detail",
  },
  {
    index: "03",
    title: "Textile",
    copy: "Soft and considered",
    image: "/images/house-of-lume/bedroom.webp",
    alt: "Soft layered textile detail",
  },
  {
    index: "04",
    title: "Living green",
    copy: "Always changing",
    image: "/images/house-of-lume/plants.webp",
    alt: "Living green leaf detail",
  },
  {
    index: "05",
    title: "Warm metal",
    copy: "A quiet glow",
    image: "/images/house-of-lume/lighting.webp",
    alt: "Warm metal lighting detail",
  },
] as const;

const services = [
  { icon: Truck, title: "Pakistan-wide delivery", copy: "Coverage across Pakistan" },
  { icon: ShieldCheck, title: "Cash on Delivery", copy: "Pay when your order arrives" },
  { icon: PackageCheck, title: "Carefully packed", copy: "Prepared for safer transit" },
  { icon: Headphones, title: "Human support", copy: "A real team when you need help" },
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
        <div className={styles.heroInner}>
          <div className={styles.heroCopy} data-home-hero-copy>
            <p className={styles.eyebrow}>Lights · Plants · Objects</p>
            <h1 id="home-title">A brighter, kinder home.</h1>
            <p className={styles.heroBody}>
              Thoughtfully curated lamps, living green and considered objects for modern homes
              across Pakistan.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href="#categories">
                Explore the collection <ArrowRight aria-hidden="true" />
              </Link>
              <Link className={styles.textCta} href="#philosophy">
                Our approach <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.heroServiceRow} aria-label="House of Lume shopping highlights">
              <div>
                <Truck aria-hidden="true" />
                <span>
                  <strong>Cash on Delivery</strong>
                  Across Pakistan
                </span>
              </div>
              <div>
                <ShieldCheck aria-hidden="true" />
                <span>
                  <strong>Production-safe checkout</strong>
                  COD-first at launch
                </span>
              </div>
              <div>
                <Leaf aria-hidden="true" />
                <span>
                  <strong>Carefully curated</strong>
                  For better everyday living
                </span>
              </div>
            </div>
          </div>

          <div className={styles.heroStage} data-home-hero-stage aria-label="House of Lume object edit">
            <div className={styles.heroStageLamp} data-home-object data-home-image>
              <Image
                src="/images/house-of-lume/lighting.webp"
                alt="Sculptural House of Lume table lamp"
                fill
                priority
                sizes="(max-width: 767px) 92vw, 40vw"
                quality={90}
              />
            </div>
            <div className={styles.heroStagePlant} data-home-object data-home-image>
              <Image
                src="/images/house-of-lume/plants.webp"
                alt="House of Lume living green"
                fill
                priority
                sizes="(max-width: 767px) 44vw, 20vw"
              />
            </div>
            <div className={styles.heroStageDecor} data-home-object data-home-image>
              <Image
                src="/images/house-of-lume/decor.webp"
                alt="House of Lume sculptural decor"
                fill
                sizes="(max-width: 767px) 44vw, 18vw"
              />
            </div>
            <div className={styles.heroAccent} data-home-object>
              <span>Good objects</span>
              <strong>Brighter days.</strong>
              <small>01 / 04</small>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.categorySection} id="categories" aria-labelledby="categories-title">
        <div className={styles.categoryIntro} data-home-reveal>
          <p className={styles.eyebrow}>Explore by category</p>
          <h2 id="categories-title">Find what belongs in your space.</h2>
          <p>Distinctive pieces for every corner of your home, arranged as a living edit.</p>
          <Link className={styles.textCta} href="#editors-picks">
            View the House Edit <ArrowRight aria-hidden="true" />
          </Link>
        </div>

        <div className={styles.categoryBento}>
          {categories.map((category, index) => (
            <article
              className={styles.categoryTile}
              data-tone={category.tone}
              data-slot={index + 1}
              data-home-image
              id={category.id}
              key={category.id}
            >
              <Image
                src={category.image}
                alt={category.alt}
                fill
                sizes="(max-width: 767px) 92vw, (max-width: 1199px) 45vw, 34vw"
              />
              <div className={styles.categoryShade} aria-hidden="true" />
              <div className={styles.categoryMeta}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{category.title}</h3>
                  <p>{category.copy}</p>
                </div>
                <ArrowRight aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.editorSection} id="editors-picks" aria-labelledby="editors-title">
        <div className={styles.editorHeader} data-home-reveal>
          <div>
            <p className={styles.eyebrow}>The House Edit</p>
            <h2 id="editors-title">Editors&apos; picks.</h2>
          </div>
          <p>
            A visual preview of the moods shaping House of Lume. Purchasable products will replace
            these editorial edits when the catalogue is published.
          </p>
        </div>

        <div className={styles.editorShelf}>
          {editorialPicks.map((item) => (
            <article className={styles.editorObject} key={item.name} data-home-reveal>
              <div className={styles.editorImage} data-home-image>
                <Image src={item.image} alt={item.alt} fill sizes="(max-width: 767px) 70vw, 20vw" />
                <span>{item.index}</span>
              </div>
              <div className={styles.editorMeta}>
                <h3>{item.name}</h3>
                <p>{item.type}</p>
                <small>Editorial preview</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.philosophy} id="philosophy" aria-labelledby="philosophy-title">
        <div className={styles.philosophyStatement} data-home-reveal>
          <p className={styles.eyebrow}>Our philosophy</p>
          <h2 id="philosophy-title">Objects should earn their place.</h2>
          <p>
            We choose light, greenery and tactile objects for what they do to a room: soften an
            edge, hold attention, improve a ritual or make everyday life feel more considered.
          </p>
        </div>
        <div className={styles.philosophyImage} data-home-parallax data-home-image>
          <Image
            src="/images/house-of-lume/collection.webp"
            alt="House of Lume collection arranged in a calm interior"
            fill
            sizes="(max-width: 767px) 100vw, 55vw"
          />
        </div>
        <aside className={styles.philosophyNote} data-home-reveal>
          <span>House note · 01</span>
          <strong>A calmer room starts with fewer, better decisions.</strong>
          <p>Light first. Living green second. Objects last.</p>
        </aside>
      </section>

      <section className={styles.spacesSection} id="rooms" aria-labelledby="spaces-title">
        <div className={styles.spacesHeader} data-home-reveal>
          <div>
            <p className={styles.eyebrow}>Homes with Lume</p>
            <h2 id="spaces-title">Real spaces. Brighter living.</h2>
          </div>
          <p>See how light, greenery and objects find a natural place in the rooms we use most.</p>
        </div>
        <div className={styles.spacesGrid}>
          {spaces.map((space, index) => (
            <article className={styles.spaceTile} data-slot={index + 1} data-home-image key={space.title}>
              <Image src={space.image} alt={space.alt} fill sizes="(max-width: 767px) 92vw, 25vw" />
              <div className={styles.spaceShade} aria-hidden="true" />
              <div className={styles.spaceMeta}>
                <span>{space.label}</span>
                <h3>{space.title}</h3>
                <ArrowRight aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.materialSection} aria-labelledby="material-title">
        <div className={styles.materialIntro} data-home-reveal>
          <p className={styles.eyebrow}>A closer look</p>
          <h2 id="material-title">The Material Archive.</h2>
          <p>
            Texture changes how an object is experienced. These are the material cues shaping the
            House of Lume point of view.
          </p>
        </div>
        <div className={styles.materialGrid}>
          {materials.map((material) => (
            <article className={styles.materialTile} key={material.title} data-home-image>
              <div className={styles.materialImage}>
                <Image src={material.image} alt={material.alt} fill sizes="(max-width: 767px) 42vw, 14vw" />
              </div>
              <span>{material.index}</span>
              <h3>{material.title}</h3>
              <p>{material.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.serviceSection} aria-labelledby="service-title">
        <div className={styles.serviceHeading}>
          <p className={styles.eyebrow}>Why shop with us</p>
          <h2 id="service-title">Made to arrive well.</h2>
        </div>
        <div className={styles.serviceGrid}>
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
        </div>
      </section>

      <section className={styles.newsletter} id="newsletter" aria-labelledby="newsletter-title">
        <div className={styles.newsletterCopy} data-home-reveal>
          <p className={styles.eyebrow}>House notes</p>
          <h2 id="newsletter-title">Join a brighter inner circle.</h2>
          <p>New arrivals, material stories and considered ideas for living better at home.</p>
        </div>
        <div className={styles.newsletterForm}>
          <NewsletterForm />
        </div>
        <div className={styles.newsletterMark} aria-hidden="true">
          <Leaf />
          <span>Brighter homes, thoughtfully made.</span>
        </div>
      </section>
    </main>
  );
}
