"use client";

import Image from "next/image";
import { useRef } from "react";

import { gsap, registerGsap, useGSAP } from "@/lib/motion/gsap";

import styles from "./home-products.module.css";

const previewProducts = [
  {
    name: "Aurelia Lamp",
    eyebrow: "Live brighter",
    detail: "Ambient form for modern living",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/f36d05ea-566c-4c14-ac8c-ccd887d8d588_vnqway.png",
    imageClass: styles.lightingImage,
  },
  {
    name: "Soleto Planter",
    eyebrow: "Bring nature in",
    detail: "Greener spaces, brighter days",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/9f13fe9a-d57a-4409-8226-130fd93033f1_ahtdkz.png",
    imageClass: styles.planterImage,
  },
  {
    name: "Forma Object",
    eyebrow: "Curated details",
    detail: "Timeless pieces, meaningful spaces",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791785000/b686182a-6a24-46b2-bd22-1cd930e3cf8f_aedoz9.png",
    imageClass: styles.objectImage,
  },
  {
    name: "Verdant Planter",
    eyebrow: "Rooted in beauty",
    detail: "Beautiful spaces grow here",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791785002/60ce4371-9fe6-4b71-a2b6-f5405e06ee19_ipno40.png",
    imageClass: styles.verdantImage,
  },
  {
    name: "Lume Candle Bowl",
    eyebrow: "The finishing touch",
    detail: "Spaces that feel like home",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791785000/0dbb84ad-5ad3-473e-b142-d68cb345d343_jcykjg.png",
    imageClass: styles.decorImage,
  },
] as const;

export function HomeProducts() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      registerGsap();

      const section = sectionRef.current;
      if (!section) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const headingParts = gsap.utils.toArray<HTMLElement>(
        `.${styles.kicker}, .${styles.title}, .${styles.intro}, .${styles.status}`,
        section,
      );
      const cards = gsap.utils.toArray<HTMLElement>(`.${styles.productUnit}`, section);
      const images = gsap.utils.toArray<HTMLElement>(`.${styles.image}`, section);

      const reveal = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          once: true,
        },
      });

      reveal
        .from(headingParts, {
          autoAlpha: 0,
          y: 18,
          duration: 0.72,
          stagger: 0.07,
        })
        .from(
          cards,
          {
            autoAlpha: 0,
            y: 24,
            duration: 0.82,
            stagger: 0.075,
          },
          0.12,
        )
        .from(
          images,
          {
            scale: 1.035,
            duration: 1,
            stagger: 0.06,
            ease: "power2.out",
          },
          0.2,
        );
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="products"
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="products-title"
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.kicker}>House of Lume</p>
          <h2 id="products-title" className={styles.title}>
            Objects for a Brighter Home
          </h2>
          <p className={styles.intro}>
            A considered preview of forms, materials, and objects shaping the House of Lume
            collection.
          </p>
          <p className={styles.status}>Editorial preview · Product catalogue not yet published</p>
        </header>

        <div className={styles.shelf} role="list" aria-label="Product editorial preview">
          {previewProducts.map((product) => (
            <article key={product.name} className={styles.productUnit} role="listitem">
              <span
                className={`${styles.edgeAccent} ${styles.edgeAccentLeftTop}`}
                aria-hidden="true"
              />
              <span
                className={`${styles.edgeAccent} ${styles.edgeAccentLeftLower}`}
                aria-hidden="true"
              />
              <span
                className={`${styles.edgeAccent} ${styles.edgeAccentRightMid}`}
                aria-hidden="true"
              />
              <span
                className={`${styles.edgeAccent} ${styles.edgeAccentRightLower}`}
                aria-hidden="true"
              />

              <div className={styles.topRail} aria-hidden="true">
                <span className={styles.topLine} />
                <span className={styles.wordmark}>House of Lume</span>
                <span className={styles.topLine} />
              </div>

              <div className={styles.objectStage}>
                <Image
                  className={`${styles.image} ${product.imageClass}`}
                  src={product.image}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 78vw, (max-width: 1180px) 31vw, 19vw"
                />
              </div>

              <div className={styles.metadata}>
                <p className={styles.eyebrow}>{product.eyebrow}</p>

                <div className={styles.nameRow}>
                  <h3>{product.name}</h3>
                  <span className={styles.nameArrow} aria-hidden="true" />
                </div>

                <div className={styles.footerRule} aria-hidden="true" />
                <p className={styles.detail}>{product.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
