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
        y: 22,
        duration: 0.95,
        ease: "power3.out",
      });

      gsap.from("[data-home-hero-stage]", {
        opacity: 0,
        x: 28,
        duration: 1.05,
        delay: 0.08,
        ease: "power3.out",
      });

      gsap.from("[data-home-object]", {
        opacity: 0,
        y: 18,
        duration: 0.7,
        delay: 0.2,
        stagger: 0.09,
        ease: "power3.out",
      });

      const reveals = gsap.utils.toArray<HTMLElement>("[data-home-reveal]");
      reveals.forEach((element) => {
        gsap.from(element, {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 89%",
            once: true,
          },
        });
      });

      const images = gsap.utils.toArray<HTMLElement>("[data-home-image]");
      images.forEach((element) => {
        gsap.fromTo(
          element,
          { clipPath: "inset(0 0 9% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 88%",
              once: true,
            },
          },
        );
      });

      const parallax = gsap.utils.toArray<HTMLElement>("[data-home-parallax]");
      parallax.forEach((element) => {
        gsap.fromTo(
          element,
          { yPercent: -1.5 },
          {
            yPercent: 2.5,
            ease: "none",
            scrollTrigger: {
              trigger: element,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.7,
            },
          },
        );
      });
    });

    media.add("(max-width: 767px)", () => {
      const reveals = gsap.utils.toArray<HTMLElement>(
        "[data-home-reveal], [data-home-image], [data-home-object]",
      );

      reveals.forEach((element) => {
        gsap.from(element, {
          opacity: 0,
          y: 12,
          duration: 0.45,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 93%",
            once: true,
          },
        });
      });
    });

    return () => media.revert();
  }, [reducedMotion]);

  return null;
}
