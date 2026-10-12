"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

import { gsap, registerGsap, useGSAP } from "@/lib/motion/gsap";

import styles from "./home-products.module.css";

const previewProducts = [
  {
    index: "01",
    name: "Aurelia Table Lamp",
    descriptor: "Lighting study",
    collection: "Lume collection preview",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/f36d05ea-566c-4c14-ac8c-ccd887d8d588_vnqway.png",
    imageClass: styles.lightingImage,
  },
  {
    index: "02",
    name: "Soleto Planter",
    descriptor: "Natural form",
    collection: "Atelier collection preview",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/9f13fe9a-d57a-4409-8226-130fd93033f1_ahtdkz.png",
    imageClass: styles.planterImage,
  },
  {
    index: "03",
    name: "Forma Object",
    descriptor: "Sculptural object",
    collection: "Atelier collection preview",
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791785000/b686182a-6a24-46b2-bd22-1cd930e3cf8f_aedoz9.png",
    imageClass: styles.objectImage,
  },
  {
    index: "04",
    name: "Lume Candle Bowl",
    descriptor: "Decorative study",
    collection: "Lume collection preview",
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

      const headerParts = gsap.utils.toArray<HTMLElement>(
        `.${styles.kickerRow}, .${styles.title}, .${styles.intro}, .${styles.status}`,
        section,
      );
      const cards = gsap.utils.toArray<HTMLElement>(`.${styles.productUnit}`, section);
      const images = gsap.utils.toArray<HTMLElement>(`.${styles.image}`, section);

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
          duration: 0.78,
          stagger: 0.08,
        })
        .from(
          cards,
          {
            autoAlpha: 0,
            y: 34,
            clipPath: "inset(0 0 16% 0)",
            duration: 0.95,
            stagger: 0.1,
          },
          0.18,
        )
        .from(
          images,
          {
            scale: 1.075,
            duration: 1.3,
            stagger: 0.08,
            ease: "power2.out",
          },
          0.25,
        );

      if (window.matchMedia("(min-width: 1101px)").matches) {
        images.forEach((image, index) => {
          gsap.fromTo(
            image,
            { yPercent: index % 2 === 0 ? -1.8 : -0.8 },
            {
              yPercent: index % 2 === 0 ? 2.6 : 1.8,
              ease: "none",
              scrollTrigger: {
                trigger: image,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.7,
              },
            },
          );
        });
      }
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
          <div className={styles.headerCopy}>
            <div className={styles.kickerRow}>
              <span aria-hidden="true" />
              <p>House of Lume</p>
            </div>
            <h2 id="products-title" className={styles.title}>
              Objects for a Brighter Home
            </h2>
            <p className={styles.intro}>
              A first look at the product language we are building — quiet forms, natural material,
              and objects designed to live beautifully in everyday spaces.
            </p>
          </div>

          <p className={styles.status}>
            <span>Editorial preview</span>
            Product catalogue not yet published
          </p>
        </header>

        <div className={styles.shelf} role="list" aria-label="Product editorial preview">
          {previewProducts.map((product) => (
            <article key={product.name} className={styles.productUnit} role="listitem">
              <div className={styles.objectStage}>
                <Image
                  className={`${styles.image} ${product.imageClass}`}
                  src={product.image}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 82vw, (max-width: 1100px) 46vw, 24vw"
                />
                <span className={styles.stageIndex} aria-hidden="true">
                  {product.index}
                </span>
              </div>

              <div className={styles.metadata}>
                <div className={styles.indexLine} aria-hidden="true">
                  <span>{product.index}</span>
                  <i />
                </div>

                <h3>{product.name}</h3>
                <p className={styles.descriptor}>
                  {product.descriptor}
                  <span aria-hidden="true">/</span>
                  {product.collection}
                </p>

                <div className={styles.previewCue} aria-label="Preview only — not yet purchasable">
                  <span>Preview only</span>
                  <i aria-hidden="true" />
                  <ArrowRight aria-hidden="true" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
