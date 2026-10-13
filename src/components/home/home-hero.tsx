"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import SplitType from "split-type";

import { gsap, registerGsap, useGSAP } from "@/lib/motion/gsap";

import styles from "./home-hero.module.css";

const AUTOPLAY_SECONDS = 8;

const slides = [
  {
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791785002/60ce4371-9fe6-4b71-a2b6-f5405e06ee19_ipno40.png",
    eyebrow: "House of Lume · Curated Living",
    title: "Refined living starts here.",
    copy: "Discover considered lighting, greenery, and objects designed to bring warmth, calm, and character to modern homes.",
    primaryLabel: "Shop now",
    secondaryLabel: "Explore collection",
  },
  {
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791785000/0dbb84ad-5ad3-473e-b142-d68cb345d343_jcykjg.png",
    eyebrow: "House of Lume · Gather",
    title: "Made for the moments that bring us together.",
    copy: "Warm woods, soft light, and thoughtful forms for dining spaces that invite people to stay a little longer.",
    primaryLabel: "Explore dining",
    secondaryLabel: "View the edit",
  },
  {
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791785000/b686182a-6a24-46b2-bd22-1cd930e3cf8f_aedoz9.png",
    eyebrow: "House of Lume · Quiet Living",
    title: "Comfort, considered down to the last detail.",
    copy: "A softer approach to modern living, built from tactile materials, balanced proportions, and warm ambient light.",
    primaryLabel: "Shop living",
    secondaryLabel: "Discover objects",
  },
  {
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/9f13fe9a-d57a-4409-8226-130fd93033f1_ahtdkz.png",
    eyebrow: "House of Lume · Living Green",
    title: "Bring a little more life indoors.",
    copy: "Layered greenery and natural textures designed to make bright rooms feel calmer, fresher, and more grounded.",
    primaryLabel: "Shop plants",
    secondaryLabel: "Explore spaces",
  },
  {
    image:
      "https://res.cloudinary.com/diometfe9/image/upload/v1791784998/f36d05ea-566c-4c14-ac8c-ccd887d8d588_vnqway.png",
    eyebrow: "House of Lume · Evening Light",
    title: "A warmer atmosphere, after sunset.",
    copy: "Sculptural lighting, layered glow, and quiet objects that change how a room feels when the day slows down.",
    primaryLabel: "Shop lighting",
    secondaryLabel: "Explore the house",
  },
] as const;

export function HomeHero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const visualTrackRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const imageRefs = useRef<Array<HTMLImageElement | null>>([]);
  const copyRefs = useRef<Array<HTMLDivElement | null>>([]);
  const titleSplitRefs = useRef<Array<SplitType | null>>([]);
  const transitionRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const autoplayRef = useRef<ReturnType<typeof gsap.delayedCall> | null>(null);
  const pointerStartRef = useRef<number | null>(null);
  const transitionLockedRef = useRef(false);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(mediaQuery.matches);

    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);

    return () => {
      mediaQuery.removeEventListener("change", syncPreference);
    };
  }, []);

  useGSAP(
    () => {
      registerGsap();

      const layers = layerRefs.current.filter((node): node is HTMLDivElement => node !== null);
      const images = imageRefs.current.filter((node): node is HTMLImageElement => node !== null);
      const copies = copyRefs.current.filter((node): node is HTMLDivElement => node !== null);

      gsap.set(layers, { autoAlpha: 0, zIndex: 0, clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(images, { scale: reducedMotion ? 1 : 1.035, xPercent: 0 });
      gsap.set(copies, { autoAlpha: 0, y: 0 });

      if (layers[0]) gsap.set(layers[0], { autoAlpha: 1, zIndex: 1 });
      if (copies[0]) gsap.set(copies[0], { autoAlpha: 1 });

      if (reducedMotion || !visualTrackRef.current || !heroRef.current) return;

      gsap.to(visualTrackRef.current, {
        yPercent: 4.5,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.85,
        },
      });
    },
    { scope: heroRef, dependencies: [reducedMotion] },
  );

  const getTitleWords = useCallback((index: number, copy: HTMLDivElement) => {
    const title = copy.querySelector<HTMLElement>(`h1.${styles.title}`);
    if (!title) return [];

    const existingWords = Array.from(title.querySelectorAll<HTMLElement>(".word"));
    if (existingWords.length > 0) return existingWords;

    const split = new SplitType(title, { types: "lines,words" });
    titleSplitRefs.current[index] = split;
    return split.words ?? [];
  }, []);

  const goTo = useCallback(
    (nextIndex: number, directionOverride?: 1 | -1) => {
      if (nextIndex === activeIndex || transitionLockedRef.current) return;

      const currentLayer = layerRefs.current[activeIndex];
      const nextLayer = layerRefs.current[nextIndex];
      const currentImage = imageRefs.current[activeIndex];
      const nextImage = imageRefs.current[nextIndex];
      const currentCopy = copyRefs.current[activeIndex];
      const nextCopy = copyRefs.current[nextIndex];

      if (!currentLayer || !nextLayer || !currentImage || !nextImage || !currentCopy || !nextCopy) {
        setActiveIndex(nextIndex);
        return;
      }

      const direction = directionOverride ?? (nextIndex > activeIndex ? 1 : -1);
      setActiveIndex(nextIndex);

      if (reducedMotion) {
        gsap.set(currentLayer, { autoAlpha: 0, zIndex: 0 });
        gsap.set(nextLayer, { autoAlpha: 1, zIndex: 1, clipPath: "inset(0% 0% 0% 0%)" });
        gsap.set(currentCopy, { autoAlpha: 0, y: 0 });
        gsap.set(nextCopy, { autoAlpha: 1, y: 0 });
        setIsTransitioning(false);
        return;
      }

      transitionLockedRef.current = true;
      setIsTransitioning(true);
      transitionRef.current?.kill();

      const titleWords = getTitleWords(nextIndex, nextCopy);
      const supportingText = [
        nextCopy.querySelector<HTMLElement>(`.${styles.eyebrow}`),
        nextCopy.querySelector<HTMLElement>(`.${styles.copy}`),
        nextCopy.querySelector<HTMLElement>(`.${styles.actions}`),
      ].filter((node): node is HTMLElement => node !== null);

      gsap.set(nextLayer, {
        autoAlpha: 1,
        zIndex: 2,
        clipPath: direction > 0 ? "inset(0% 0% 0% 8%)" : "inset(0% 8% 0% 0%)",
      });
      gsap.set(nextImage, { scale: 1.085, xPercent: direction * 1.25 });
      gsap.set(nextCopy, { autoAlpha: 1, y: 0, filter: "none" });
      gsap.set(titleWords, {
        autoAlpha: 0,
        yPercent: 72,
        rotateX: 10,
        scale: 0.985,
        filter: "blur(14px)",
        transformOrigin: "50% 100%",
        willChange: "transform,filter,opacity",
      });
      gsap.set(supportingText, {
        autoAlpha: 0,
        y: 14,
        filter: "blur(8px)",
        willChange: "transform,filter,opacity",
      });

      transitionRef.current = gsap
        .timeline({
          defaults: { overwrite: "auto" },
          onComplete: () => {
            gsap.set(currentLayer, { autoAlpha: 0, zIndex: 0, clipPath: "inset(0% 0% 0% 0%)" });
            gsap.set(nextLayer, { autoAlpha: 1, zIndex: 1 });
            gsap.set(currentImage, { scale: 1.035, xPercent: 0 });
            gsap.set(currentCopy, { autoAlpha: 0, y: 0, clearProps: "filter" });
            transitionLockedRef.current = false;
            setIsTransitioning(false);
          },
        })
        .to(
          currentCopy,
          {
            autoAlpha: 0,
            y: -18,
            filter: "blur(8px)",
            duration: 0.38,
            ease: "power2.in",
          },
          0,
        )
        .to(currentLayer, { autoAlpha: 0, duration: 0.72, ease: "power2.out" }, 0.18)
        .to(nextLayer, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.05, ease: "power3.inOut" }, 0)
        .to(nextImage, { scale: 1.025, xPercent: 0, duration: 1.45, ease: "power3.out" }, 0)
        .to(
          titleWords,
          {
            autoAlpha: 1,
            yPercent: 0,
            rotateX: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 1.05,
            stagger: 0.032,
            ease: "power4.out",
            clearProps: "transform,filter,opacity,visibility,willChange",
          },
          0.28,
        )
        .to(
          supportingText,
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.78,
            stagger: 0.07,
            ease: "power3.out",
            clearProps: "transform,filter,opacity,visibility,willChange",
          },
          0.38,
        );
    },
    [activeIndex, getTitleWords, reducedMotion],
  );

  const showPrevious = useCallback(() => {
    goTo((activeIndex - 1 + slides.length) % slides.length, -1);
  }, [activeIndex, goTo]);

  const showNext = useCallback(() => {
    goTo((activeIndex + 1) % slides.length, 1);
  }, [activeIndex, goTo]);

  useEffect(() => {
    autoplayRef.current?.kill();
    autoplayRef.current = null;

    if (reducedMotion) return;

    const delayedCall = gsap.delayedCall(AUTOPLAY_SECONDS, showNext);
    if (paused) delayedCall.pause();
    autoplayRef.current = delayedCall;

    return () => {
      delayedCall.kill();
    };
  }, [activeIndex, paused, reducedMotion, showNext]);

  useEffect(() => {
    const titleSplits = titleSplitRefs.current;

    return () => {
      transitionRef.current?.kill();
      autoplayRef.current?.kill();
      titleSplits.forEach((split) => split?.revert());
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button")) return;
    pointerStartRef.current = event.clientX;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (pointerStartRef.current === null) return;

    const delta = event.clientX - pointerStartRef.current;
    pointerStartRef.current = null;

    if (Math.abs(delta) < 48) return;
    if (delta > 0) showPrevious();
    else showNext();
  };

  return (
    <section
      ref={heroRef}
      className={styles.hero}
      data-paused={paused || reducedMotion ? "true" : "false"}
      aria-label="House of Lume introduction"
      aria-roledescription="carousel"
      aria-busy={isTransitioning}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className={styles.stage}>
        <div ref={visualTrackRef} className={styles.visualTrack} aria-hidden="true">
          {slides.map((slide, index) => (
            <div
              key={slide.image}
              ref={(node) => {
                layerRefs.current[index] = node;
              }}
              className={styles.visualLayer}
              data-index={index}
            >
              <Image
                ref={(node) => {
                  imageRefs.current[index] = node;
                }}
                className={styles.heroImage}
                src={slide.image}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
              />
            </div>
          ))}
        </div>

        <div className={styles.overlay} data-slide={activeIndex} aria-hidden="true" />
        <div className={styles.vignette} aria-hidden="true" />

        <div className={styles.inner}>
          <div className={styles.copyStage}>
            {slides.map((slide, index) => (
              <div
                key={slide.title}
                ref={(node) => {
                  copyRefs.current[index] = node;
                }}
                className={styles.copyWrap}
                data-active={index === activeIndex ? "true" : "false"}
                aria-hidden={index !== activeIndex}
              >
                <p className={styles.eyebrow}>{slide.eyebrow}</p>
                <h1 className={styles.title}>{slide.title}</h1>
                <p className={styles.copy}>{slide.copy}</p>
                <div className={styles.actions}>
                  <Link
                    className={styles.primaryAction}
                    href={
                      index === 3
                        ? "/categories/plants"
                        : index === 4
                          ? "/categories/lighting"
                          : "/shop"
                    }
                    tabIndex={index === activeIndex ? 0 : -1}
                  >
                    {slide.primaryLabel}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                  <Link
                    className={styles.secondaryAction}
                    href={
                      index === 0
                        ? "/collections/new-arrivals"
                        : index === 3
                          ? "/collections/living-green"
                          : index === 4
                            ? "/collections/warm-lighting"
                            : "/collections/house-essentials"
                    }
                    tabIndex={index === activeIndex ? 0 : -1}
                  >
                    {slide.secondaryLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.controls}>
            <div className={styles.pagination} aria-label="Choose hero slide">
              {slides.map((slide, index) => (
                <button
                  key={slide.title}
                  className={styles.paginationItem}
                  type="button"
                  data-active={index === activeIndex ? "true" : "false"}
                  onClick={() => goTo(index)}
                  aria-label={`Show slide ${index + 1}: ${slide.title}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  disabled={isTransitioning}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <i aria-hidden="true">
                    <b />
                  </i>
                </button>
              ))}
            </div>

            <div className={styles.controlCluster}>
              <button
                className={styles.motionControl}
                type="button"
                onClick={() => setPaused((current) => !current)}
                aria-label={paused ? "Resume hero autoplay" : "Pause hero autoplay"}
                aria-pressed={paused}
                disabled={reducedMotion}
              >
                {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
              </button>

              <div className={styles.arrows}>
                <button
                  type="button"
                  onClick={showPrevious}
                  aria-label="Previous hero slide"
                  disabled={isTransitioning}
                >
                  <ArrowLeft aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Next hero slide"
                  disabled={isTransitioning}
                >
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          Slide {activeIndex + 1} of {slides.length}: {slides[activeIndex].title}
        </p>
      </div>
    </section>
  );
}
