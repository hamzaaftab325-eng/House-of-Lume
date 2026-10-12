"use client";

import { useRef } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { gsap, registerGsap, useGSAP } from "@/lib/motion/gsap";

import styles from "./home-categories.module.css";

const BACKGROUND_IMAGE =
  "https://res.cloudinary.com/diometfe9/image/upload/v1791787597/6b527697-6610-41bd-874d-6b8dda58e4be_uzr6b7.png";

const MAIN_IMAGE =
  "https://res.cloudinary.com/diometfe9/image/upload/v1791785002/60ce4371-9fe6-4b71-a2b6-f5405e06ee19_ipno40.png";

const categories = [
  {
    name: "Lighting",
    description: "Illuminate spaces",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/f36d05ea-566c-4c14-ac8c-ccd887d8d588_vnqway.png",
    position: styles.lighting,
    imageClass: styles.lightingImage,
  },
  {
    name: "Plants",
    description: "Bring life in",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/9f13fe9a-d57a-4409-8226-130fd93033f1_ahtdkz.png",
    position: styles.plants,
    imageClass: styles.plantsImage,
  },
  {
    name: "Objects",
    description: "Curated details",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791785000/b686182a-6a24-46b2-bd22-1cd930e3cf8f_aedoz9.png",
    position: styles.objects,
    imageClass: styles.objectsImage,
  },
  {
    name: "Planters",
    description: "Rooted in beauty",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791785002/60ce4371-9fe6-4b71-a2b6-f5405e06ee19_ipno40.png",
    position: styles.planters,
    imageClass: styles.plantersImage,
  },
  {
    name: "Décor",
    description: "The finishing touch",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791785000/0dbb84ad-5ad3-473e-b142-d68cb345d343_jcykjg.png",
    position: styles.decor,
    imageClass: styles.decorImage,
  },
] as const;

export function HomeCategories() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      registerGsap();

      const section = sectionRef.current;
      if (!section) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) return;

      const headerParts = gsap.utils.toArray<HTMLElement>(
        `.${styles.kicker}, .${styles.title}, .${styles.subtitle}`,
        section,
      );
      const categoryItems = gsap.utils.toArray<HTMLElement>(`.${styles.categoryItem}`, section);
      const categoryFloaters = gsap.utils.toArray<HTMLElement>(`.${styles.categoryFloat}`, section);
      const orbitPaths = gsap.utils.toArray<SVGPathElement>(`.${styles.orbitPath}`, section);
      const orbitNodes = gsap.utils.toArray<SVGCircleElement>(`.${styles.orbitNode}`, section);
      const mainStage = section.querySelector<HTMLElement>(`.${styles.mainStage}`);
      const mainCopyParts = gsap.utils.toArray<HTMLElement>(
        `.${styles.mainCopy} > p, .${styles.mainCopy} > h3, .${styles.exploreCue}`,
        section,
      );
      const mainFloat = section.querySelector<HTMLElement>(`.${styles.mainFloat}`);

      orbitPaths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
      });

      gsap.set(orbitNodes, {
        scale: 0,
        transformOrigin: "50% 50%",
      });

      const reveal = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: section,
          start: "top 76%",
          once: true,
        },
      });

      reveal
        .from(headerParts, {
          autoAlpha: 0,
          y: 24,
          duration: 0.85,
          stagger: 0.1,
        })
        .from(
          mainStage,
          {
            autoAlpha: 0,
            scale: 0.82,
            rotation: -2,
            duration: 1.05,
          },
          0.18,
        )
        .to(
          orbitPaths,
          {
            strokeDashoffset: 0,
            duration: 1.25,
            stagger: 0.06,
            ease: "power2.inOut",
          },
          0.28,
        )
        .to(
          orbitNodes,
          {
            scale: 1,
            duration: 0.48,
            stagger: 0.055,
            ease: "back.out(2)",
          },
          0.55,
        )
        .from(
          categoryItems,
          {
            autoAlpha: 0,
            y: 30,
            scale: 0.76,
            duration: 0.92,
            stagger: 0.1,
          },
          0.42,
        )
        .from(
          mainCopyParts,
          {
            autoAlpha: 0,
            y: 16,
            duration: 0.66,
            stagger: 0.08,
          },
          0.8,
        );

      if (backgroundRef.current) {
        gsap.fromTo(
          backgroundRef.current,
          { yPercent: -2.5, scale: 1.025 },
          {
            yPercent: 4.5,
            scale: 1.06,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.85,
            },
          },
        );
      }

      if (window.matchMedia("(min-width: 1101px)").matches) {
        categoryFloaters.forEach((floater, index) => {
          gsap.to(floater, {
            y: index % 2 === 0 ? -7 : 6,
            rotation: index === 2 ? 0 : index % 2 === 0 ? 0.55 : -0.55,
            duration: 4.4 + index * 0.32,
            delay: index * 0.18,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        });

        if (mainFloat) {
          gsap.to(mainFloat, {
            y: -5,
            duration: 5.6,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        }
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
          <path
            className={`${styles.orbitArc} ${styles.orbitPath}`}
            d="M 265 28 C 120 170 118 465 330 592"
          />
          <path
            className={`${styles.orbitArc} ${styles.orbitPath}`}
            d="M 735 28 C 880 170 882 465 670 592"
          />
          <path className={`${styles.connectorLine} ${styles.orbitPath}`} d="M 145 170 L 312 228" />
          <path className={`${styles.connectorLine} ${styles.orbitPath}`} d="M 180 475 L 340 398" />
          <path className={`${styles.connectorLine} ${styles.orbitPath}`} d="M 855 170 L 688 228" />
          <path className={`${styles.connectorLine} ${styles.orbitPath}`} d="M 820 475 L 660 398" />
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
          <div className={styles.mainFloat}>
            <span className={styles.mainHalo} aria-hidden="true" />
            <div className={styles.mainImageWrap}>
              <Image
                className={styles.mainImage}
                src={MAIN_IMAGE}
                alt=""
                fill
                sizes="(max-width: 1100px) 78vw, 34vw"
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
          </div>
        </article>

        <div className={styles.categoryList} role="list" aria-label="Home categories">
          {categories.map((category) => (
            <article
              key={category.name}
              className={`${styles.categoryItem} ${category.position}`}
              role="listitem"
            >
              <div className={styles.categoryFloat}>
                <div className={styles.circleFrame}>
                  <div className={styles.circle}>
                    <Image
                      className={`${styles.circleImage} ${category.imageClass}`}
                      src={category.image}
                      alt=""
                      fill
                      sizes="(max-width: 560px) 44vw, (max-width: 1100px) 31vw, 16vw"
                    />
                  </div>
                </div>
                <div className={styles.categoryCopy}>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <span aria-hidden="true" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
