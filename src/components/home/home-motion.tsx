"use client";

import { useReducedMotion } from "motion/react";

import { gsap, registerGsap, useGSAP } from "@/lib/motion/gsap";

export function HomeMotion() {
  const reducedMotion = useReducedMotion();

  useGSAP(() => {
    registerGsap();
    if (reducedMotion) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const revealItems = gsap.utils.toArray<HTMLElement>("[data-home-reveal]");
      revealItems.forEach((element) => {
        gsap.from(element, {
          opacity: 0,
          y: 26,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true,
          },
        });
      });

      const headingItems = gsap.utils.toArray<HTMLElement>("[data-home-heading]");
      headingItems.forEach((element) => {
        gsap.from(element, {
          opacity: 0,
          y: 34,
          duration: 1.05,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 86%",
            once: true,
          },
        });
      });

      const imageItems = gsap.utils.toArray<HTMLElement>("[data-home-image]");
      imageItems.forEach((element) => {
        gsap.fromTo(
          element,
          { clipPath: "inset(0 0 14% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: 1.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 86%",
              once: true,
            },
          },
        );
      });

      const lineItems = gsap.utils.toArray<HTMLElement>("[data-lume-line]");
      lineItems.forEach((element) => {
        const isVertical = element.offsetHeight > element.offsetWidth * 4;
        gsap.fromTo(element, isVertical ? { scaleY: 0 } : { scaleX: 0 }, {
          ...(isVertical ? { scaleY: 1 } : { scaleX: 1 }),
          duration: 1.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 92%",
            once: true,
          },
        });
      });

      const parallaxItems = gsap.utils.toArray<HTMLElement>("[data-home-parallax]");
      parallaxItems.forEach((element) => {
        gsap.fromTo(
          element,
          { yPercent: -2.5 },
          {
            yPercent: 3.5,
            ease: "none",
            scrollTrigger: {
              trigger: element,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.9,
            },
          },
        );
      });

      const heroMedia = document.querySelector<HTMLElement>("[data-home-hero-media]");
      const heroCopy = document.querySelector<HTMLElement>("[data-home-hero-copy]");

      if (heroMedia) {
        gsap.to(heroMedia, {
          scale: 1.045,
          yPercent: 3.5,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-home-hero]",
            start: "top top",
            end: "bottom top",
            scrub: 0.85,
          },
        });
      }

      if (heroCopy) {
        gsap.to(heroCopy, {
          yPercent: -4,
          opacity: 0.84,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-home-hero]",
            start: "top top",
            end: "bottom 22%",
            scrub: 0.75,
          },
        });
      }
    });

    mm.add("(max-width: 767px)", () => {
      const revealItems = gsap.utils.toArray<HTMLElement>(
        "[data-home-reveal], [data-home-heading], [data-home-image]",
      );

      revealItems.forEach((element) => {
        gsap.from(element, {
          opacity: 0,
          y: 16,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 92%",
            once: true,
          },
        });
      });
    });

    return () => mm.revert();
  }, [reducedMotion]);

  return null;
}
