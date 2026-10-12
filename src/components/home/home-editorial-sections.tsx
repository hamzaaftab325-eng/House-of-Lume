"use client";

import Image from "next/image";
import { ArrowRight, Headphones, PackageCheck, Truck, WalletCards } from "lucide-react";
import { useRef } from "react";

import { gsap, registerGsap, useGSAP } from "@/lib/motion/gsap";

import styles from "./home-editorial-sections.module.css";

const images = {
  living:
    "https://res.cloudinary.com/diometfe9/image/upload/v1791785002/60ce4371-9fe6-4b71-a2b6-f5405e06ee19_ipno40.png",
  dining:
    "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/9f13fe9a-d57a-4409-8226-130fd93033f1_ahtdkz.png",
  object:
    "https://res.cloudinary.com/diometfe9/image/upload/v1791785000/b686182a-6a24-46b2-bd22-1cd930e3cf8f_aedoz9.png",
  lighting:
    "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/f36d05ea-566c-4c14-ac8c-ccd887d8d588_vnqway.png",
  decor:
    "https://res.cloudinary.com/diometfe9/image/upload/v1791785000/0dbb84ad-5ad3-473e-b142-d68cb345d343_jcykjg.png",
} as const;

const roomObjects = [
  { name: "Aurelia Pendant", type: "Lighting", image: images.lighting },
  { name: "Forma Coffee Table", type: "Objects", image: images.object },
  { name: "Soleto Planter", type: "Planters", image: images.decor },
] as const;

const spaceTabs = ["Living room", "Dining room", "Entryway", "Outdoor"] as const;

const materials = [
  {
    name: "Travertine",
    detail: "Naturally timeless",
    image: images.object,
    className: styles.materialLarge,
  },
  {
    name: "Ceramic",
    detail: "Handcrafted beauty",
    image: images.decor,
    className: styles.materialSmall,
  },
  {
    name: "Linen",
    detail: "Natural comfort",
    image: images.living,
    className: styles.materialSmall,
  },
  {
    name: "Brass",
    detail: "Refined accents",
    image: images.lighting,
    className: styles.materialSmall,
  },
  {
    name: "Smoked oak",
    detail: "Rich in character",
    image: images.dining,
    className: styles.materialSmall,
  },
  {
    name: "Greenery",
    detail: "Brings life in",
    image: images.living,
    className: styles.materialSmall,
  },
] as const;

const notes = [
  {
    eyebrow: "Materials",
    title: "The Beauty of Natural Textures",
    copy: "Earthy materials bring warmth, depth, and a sense of calm to everyday spaces.",
    image: images.decor,
    featured: false,
  },
  {
    eyebrow: "At home",
    title: "Designing for a Softer Light",
    copy: "From golden mornings to quiet evenings, discover how light shapes the feeling of home.",
    image: images.living,
    featured: true,
  },
  {
    eyebrow: "Curated living",
    title: "Objects with a Deeper Meaning",
    copy: "The stories, places, and people behind the pieces we choose to live with.",
    image: images.object,
    featured: false,
  },
] as const;

const services = [
  {
    title: "Carefully Packed",
    copy: "Every piece is considered from shelf to doorstep.",
    image: images.decor,
    icon: PackageCheck,
  },
  {
    title: "Pakistan-Wide Delivery",
    copy: "Thoughtful home pieces delivered across Pakistan.",
    image: images.living,
    icon: Truck,
  },
  {
    title: "Cash on Delivery",
    copy: "Pay when your order arrives at your doorstep.",
    image: images.object,
    icon: WalletCards,
  },
  {
    title: "Human Support",
    copy: "Clear, friendly help whenever you need it.",
    image: images.lighting,
    icon: Headphones,
  },
] as const;

export function HomeEditorialSections() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      registerGsap();

      const root = rootRef.current;
      if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const sections = gsap.utils.toArray<HTMLElement>("[data-editorial-section]", root);

      sections.forEach((section) => {
        const revealItems = gsap.utils.toArray<HTMLElement>("[data-reveal]", section);
        const media = gsap.utils.toArray<HTMLElement>(
          `.${styles.coverImage}, .${styles.closingImage}`,
          section,
        );

        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
              once: true,
            },
          })
          .from(revealItems, {
            autoAlpha: 0,
            y: 22,
            duration: 0.78,
            stagger: 0.07,
          })
          .from(
            media,
            {
              scale: 1.035,
              duration: 1.05,
              stagger: 0.05,
              ease: "power2.out",
            },
            0.08,
          );
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef}>
      <section
        className={styles.spacesSection}
        data-editorial-section
        aria-labelledby="spaces-title"
      >
        <header className={styles.centerHeader}>
          <p className={styles.kicker} data-reveal>House of Lume</p>
          <h2 id="spaces-title" data-reveal>Discover Spaces</h2>
          <p data-reveal>Curated lighting, decor, and greenery to bring every room to life.</p>
        </header>

        <div className={styles.spacesFrame}>
          <div className={styles.roomStage} data-reveal>
            <Image
              src={images.living}
              alt="Warm House of Lume living room"
              fill
              className={styles.coverImage}
              sizes="(max-width: 900px) 100vw, 68vw"
            />
            <span className={`${styles.hotspot} ${styles.hotspotOne}`} aria-hidden="true">+</span>
            <span className={`${styles.hotspot} ${styles.hotspotTwo}`} aria-hidden="true">+</span>
            <span className={`${styles.hotspot} ${styles.hotspotThree}`} aria-hidden="true">+</span>
          </div>

          <aside className={styles.roomPanel} data-reveal>
            <p className={styles.panelKicker}>The living room</p>
            <h3>Where Comfort Meets Character</h3>
            <p className={styles.panelCopy}>
              Layered textures, natural materials, and considered lighting create a living space
              that feels effortless and distinctly yours.
            </p>
            <a className={styles.primaryLink} href="#products">
              Shop the room
              <ArrowRight aria-hidden="true" />
            </a>

            <div className={styles.roomObjects}>
              {roomObjects.map((item) => (
                <div key={item.name} className={styles.roomObject}>
                  <div className={styles.roomThumb}>
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className={styles.coverImage}
                      sizes="80px"
                    />
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.type}</span>
                  </div>
                  <ArrowRight aria-hidden="true" />
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className={styles.spaceTabs} data-reveal>
          {spaceTabs.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </section>

      <section
        className={styles.materialSection}
        data-editorial-section
        aria-labelledby="materials-title"
      >
        <div className={styles.materialIntro}>
          <p className={styles.kicker} data-reveal>House of Lume</p>
          <h2 id="materials-title" data-reveal>Material Library</h2>
          <p data-reveal>
            Natural materials, considered details, and enduring beauty — the foundations of a more
            thoughtful home.
          </p>
          <a href="#products" className={styles.textLink} data-reveal>
            Explore materials
            <ArrowRight aria-hidden="true" />
          </a>
        </div>

        <div className={styles.materialGrid}>
          {materials.map((material, index) => (
            <article
              key={material.name}
              className={`${styles.materialTile} ${material.className}`}
              data-reveal
            >
              <Image
                src={material.image}
                alt=""
                fill
                className={styles.coverImage}
                sizes="(max-width: 900px) 50vw, 28vw"
              />
              <div className={styles.materialShade} aria-hidden="true" />
              <div className={styles.materialMeta}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{material.name}</strong>
                <small>{material.detail}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.notesSection} data-editorial-section aria-labelledby="notes-title">
        <header className={styles.centerHeader}>
          <p className={styles.kicker} data-reveal>House of Lume</p>
          <h2 id="notes-title" data-reveal>House Notes</h2>
          <p data-reveal>
            Stories on light, living, and materials — a journal for a more beautiful home, inside
            and out.
          </p>
        </header>

        <div className={styles.notesGrid}>
          {notes.map((note) => (
            <article
              key={note.title}
              className={`${styles.noteCard} ${note.featured ? styles.noteFeatured : ""}`}
              data-reveal
            >
              <div className={styles.noteImage}>
                <Image
                  src={note.image}
                  alt=""
                  fill
                  className={styles.coverImage}
                  sizes="(max-width: 900px) 100vw, 44vw"
                />
              </div>
              <div className={styles.noteCopy}>
                <span>{note.eyebrow}</span>
                <h3>{note.title}</h3>
                <p>{note.copy}</p>
                <ArrowRight aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.whySection} data-editorial-section aria-labelledby="why-title">
        <header className={styles.centerHeader}>
          <p className={styles.kicker} data-reveal>House of Lume</p>
          <h2 id="why-title" data-reveal>Why House of Lume</h2>
          <p data-reveal>
            A more beautiful home, made effortless. From our space to yours, every detail is
            designed with care.
          </p>
        </header>

        <div className={styles.serviceGrid}>
          {services.map(({ title, copy, image, icon: Icon }) => (
            <article key={title} className={styles.serviceCard} data-reveal>
              <div className={styles.serviceImage}>
                <Image
                  src={image}
                  alt=""
                  fill
                  className={styles.coverImage}
                  sizes="(max-width: 900px) 50vw, 23vw"
                />
              </div>
              <div className={styles.serviceIcon}>
                <Icon aria-hidden="true" />
              </div>
              <h3>{title}</h3>
              <span className={styles.miniLine} aria-hidden="true" />
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className={styles.closingSection}
        data-editorial-section
        aria-labelledby="closing-title"
      >
        <Image src={images.living} alt="" fill className={styles.closingImage} sizes="100vw" />
        <div className={styles.closingWash} aria-hidden="true" />
        <div className={styles.closingContent}>
          <p className={styles.kicker} data-reveal>House of Lume</p>
          <h2 id="closing-title" data-reveal>A More Beautiful Tomorrow</h2>
          <p data-reveal>
            Inspiration, new arrivals, and thoughtful living — created for a calmer, brighter home.
          </p>
          <div className={styles.newsletterShell} data-reveal aria-label="Newsletter preview">
            <input
              type="email"
              placeholder="Newsletter opens soon"
              disabled
              aria-label="Newsletter signup coming soon"
            />
            <button type="button" disabled>
              Join us
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
          <div className={styles.closingMeta} data-reveal>
            <span>New arrivals</span>
            <span>Home inspiration</span>
            <span>Exclusive offers</span>
          </div>
        </div>
      </section>
    </div>
  );
}
