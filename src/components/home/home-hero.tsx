"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import styles from "./home-hero.module.css";

const slides = [
  {
    eyebrow: "House of Lume · Curated Living",
    title: "Refined living starts here.",
    copy: "Discover considered lighting, greenery, and objects designed to bring warmth, calm, and character to modern homes.",
  },
  {
    eyebrow: "House of Lume · Lighting",
    title: "Light that changes the room.",
    copy: "Sculptural lighting and warm material finishes selected to make everyday spaces feel more intentional.",
  },
  {
    eyebrow: "House of Lume · Objects",
    title: "Thoughtful objects, quieter spaces.",
    copy: "A restrained edit of tactile forms, living green, and useful details made for homes that feel lived in.",
  },
] as const;

export function HomeHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  return (
    <section
      className={styles.hero}
      aria-label="House of Lume introduction"
      aria-roledescription="carousel"
    >
      <div className={styles.visual} data-slide={activeIndex} aria-hidden="true">
        <Image
          className={styles.heroImage}
          src="/images/house-of-lume/hero-living-room.webp"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.copyWrap} key={activeIndex} aria-live="polite">
          <p className={styles.eyebrow}>{activeSlide.eyebrow}</p>
          <h1 className={styles.title}>{activeSlide.title}</h1>
          <p className={styles.copy}>{activeSlide.copy}</p>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/#shop">
              Shop now
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link className={styles.secondaryAction} href="/#collection">
              Explore collection
            </Link>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.pagination} aria-label="Choose hero slide">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                className={styles.paginationItem}
                type="button"
                data-active={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show slide ${index + 1}: ${slide.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <i aria-hidden="true" />
              </button>
            ))}
          </div>

          <div className={styles.arrows}>
            <button type="button" onClick={showPrevious} aria-label="Previous hero slide">
              <ArrowLeft aria-hidden="true" />
            </button>
            <button type="button" onClick={showNext} aria-label="Next hero slide">
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
