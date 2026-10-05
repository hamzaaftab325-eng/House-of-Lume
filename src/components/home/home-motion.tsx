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
          y: 36,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true,
          },
        });
      });

      const parallaxItems = gsap.utils.toArray<HTMLElement>("[data-home-parallax]");
      parallaxItems.forEach((element) => {
        gsap.fromTo(
          element,
          { yPercent: -3 },
          {
            yPercent: 4,
            ease: "none",
            scrollTrigger: {
              trigger: element,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          },
        );
      });

      const heroMedia = document.querySelector<HTMLElement>("[data-home-hero-media]");
      const heroCopy = document.querySelector<HTMLElement>("[data-home-hero-copy]");
      if (heroMedia) {
        gsap.to(heroMedia, {
          scale: 1.035,
          yPercent: 4,
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
          yPercent: -7,
          opacity: 0.78,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-home-hero]",
            start: "top top",
            end: "bottom 25%",
            scrub: 0.7,
          },
        });
      }
    });

    mm.add("(max-width: 767px)", () => {
      const revealItems = gsap.utils.toArray<HTMLElement>("[data-home-reveal]");
      revealItems.forEach((element) => {
        gsap.from(element, {
          opacity: 0,
          y: 18,
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
