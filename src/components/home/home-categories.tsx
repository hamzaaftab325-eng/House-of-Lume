"use client";

import { useRef } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { gsap, registerGsap, useGSAP } from "@/lib/motion/gsap";

import styles from "./home-categories.module.css";

const BACKGROUND_IMAGE =
  "https://res.cloudinary.com/diometfe9/image/upload/v1791787597/6b527697-6610-41bd-874d-6b8dda58e4be_uzr6b7.png";

const categories = [
  {
    index: "01",
    name: "Lighting",
    description: "Illuminate spaces",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/f36d05ea-566c-4c14-ac8c-ccd887d8d588_vnqway.png",
    position: styles.lighting,
  },
  {
    index: "02",
    name: "Plants",
    description: "Bring life in",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/9f13fe9a-d57a-4409-8226-130fd93033f1_ahtdkz.png",
    position: styles.plants,
  },
  {
    index: "03",
    name: "Objects",
    description: "Curated details",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791785000/b686182a-6a24-46b2-bd22-1cd930e3cf8f_aedoz9.png",
    position: styles.objects,
  },
  {
    index: "04",
    name: "Planters",
    description: "Rooted in beauty",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791785002/60ce4371-9fe6-4b71-a2b6-f5405e06ee19_ipno40.png",
    position: styles.planters,
  },
  {
    index: "05",
    name: "Décor",
    description: "The finishing touch",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791785000/0dbb84ad-5ad3-473e-b142-d68cb345d343_jcykjg.png",
    position: styles.decor,
  },
] as const;

export function HomeCategories() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      registerGsap();

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion || !sectionRef.current) return;

      const revealItems = gsap.utils.toArray<HTMLElement>(
        `.${styles.header}, .${styles.mainStage}, .${styles.categoryItem}`,
        sectionRef.current,
      );

      gsap.fromTo(
        revealItems,
        { autoAlpha: 0, y: 34, scale: 0.985 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 1,
          stagger: 0.09,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 72%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        `.${styles.orbitGraphic}`,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 1.4,
          delay: 0.25,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            once: true,
          },
        },
      );

      if (backgroundRef.current) {
        gsap.fromTo(
          backgroundRef.current,
          { yPercent: -2 },
          {
            yPercent: 4,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.9,
            },
          },
        );
      }
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="categories"
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="categories-title"
    >
      <div ref={backgroundRef} className={styles.background} aria-hidden="true">
        <Image
          className={styles.backgroundImage}
          src={BACKGROUND_IMAGE}
          alt=""
          fill
          sizes="100vw"
        />
      </div>
      <div className={styles.backgroundWash} aria-hidden="true" />

      <header className={styles.header}>
        <p className={styles.kicker}>House of Lume</p>
        <h2 id="categories-title" className={styles.title}>
          Explore the House
        </h2>
        <p className={styles.subtitle}>
          Lighting, greenery, objects and more — curated for a more beautiful home, inside and out.
        </p>
      </header>

      <div className={styles.orbit}>
        <svg
          className={styles.orbitGraphic}
          viewBox="0 0 1000 680"
          role="presentation"
          aria-hidden="true"
        >
          <path className={styles.orbitArc} d="M 265 28 C 120 170 118 465 330 592" />
          <path className={styles.orbitArc} d="M 735 28 C 880 170 882 465 670 592" />
          <path className={styles.connectorLine} d="M 145 170 L 312 228" />
          <path className={styles.connectorLine} d="M 180 475 L 340 398" />
          <path className={styles.connectorLine} d="M 855 170 L 688 228" />
          <path className={styles.connectorLine} d="M 820 475 L 660 398" />
          <circle className={styles.orbitNode} cx="195" cy="187" r="5" />
          <circle className={styles.orbitNode} cx="252" cy="207" r="7" />
          <circle className={styles.orbitNode} cx="216" cy="457" r="5" />
          <circle className={styles.orbitNode} cx="272" cy="430" r="7" />
          <circle className={styles.orbitNode} cx="805" cy="187" r="5" />
          <circle className={styles.orbitNode} cx="748" cy="207" r="7" />
          <circle className={styles.orbitNode} cx="784" cy="457" r="5" />
          <circle className={styles.orbitNode} cx="728" cy="430" r="7" />
        </svg>

        <article className={styles.mainStage} aria-label="House of Lume collection">
          <div className={styles.mainImageWrap}>
            <Image
              className={styles.mainImage}
              src="https://res.cloudinary.com/diometfe9/image/upload/v1791785002/60ce4371-9fe6-4b71-a2b6-f5405e06ee19_ipno40.png"
              alt=""
              fill
              sizes="(max-width: 900px) 86vw, 34vw"
            />
            <div className={styles.mainShade} aria-hidden="true" />
            <div className={styles.mainCopy}>
              <p>House of Lume</p>
              <h3>A More Beautiful Home</h3>
              <span className={styles.exploreCue}>
                Explore all
                <ArrowRight aria-hidden="true" />
              </span>
            </div>
          </div>
        </article>

        <div className={styles.categoryList} role="list" aria-label="Home categories">
          {categories.map((category) => (
            <article
              key={category.name}
              className={`${styles.categoryItem} ${category.position}`}
              role="listitem"
            >
              <div className={styles.circle}>
                <Image
                  className={styles.circleImage}
                  src={category.image}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 42vw, 16vw"
                />
                <span className={styles.numberBadge}>{category.index}</span>
              </div>
              <div className={styles.categoryCopy}>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <span aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
