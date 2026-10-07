"use client";

import { useReducedMotion } from "motion/react";

import { gsap, registerGsap, useGSAP } from "@/lib/motion/gsap";

export function HomeMotion() {
  const reducedMotion = useReducedMotion();

  useGSAP(() => {
    registerGsap();
    if (reducedMotion) return;

    const media = gsap.matchMedia();

    media.add("(min-width: 768px)", () => {
      gsap.from("[data-home-hero-copy]", {
        opacity: 0,
        y: 26,
        duration: 1,
        ease: "power3.out",
      });

      const reveals = gsap.utils.toArray<HTMLElement>("[data-home-reveal]");
      reveals.forEach((element) => {
        gsap.from(element, {
          opacity: 0,
          y: 24,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true,
          },
        });
      });

      const images = gsap.utils.toArray<HTMLElement>("[data-home-image]");
      images.forEach((element) => {
        gsap.fromTo(
          element,
          { clipPath: "inset(0 0 12% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 87%",
              once: true,
            },
          },
        );
      });

      const parallax = gsap.utils.toArray<HTMLElement>("[data-home-parallax]");
      parallax.forEach((element) => {
        gsap.fromTo(
          element,
          { yPercent: -2 },
          {
            yPercent: 3,
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

      gsap.to("[data-home-hero-media]", {
        scale: 1.035,
        yPercent: 2.5,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-home-hero]",
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });
    });

    media.add("(max-width: 767px)", () => {
      const reveals = gsap.utils.toArray<HTMLElement>("[data-home-reveal], [data-home-image]");
      reveals.forEach((element) => {
        gsap.from(element, {
          opacity: 0,
          y: 14,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 92%",
            once: true,
          },
        });
      });
    });

    return () => media.revert();
  }, [reducedMotion]);

  return null;
}
