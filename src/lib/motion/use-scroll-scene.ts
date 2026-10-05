"use client";

import { useRef } from "react";
import { useReducedMotion } from "motion/react";

import { gsap, registerGsap, ScrollTrigger, useGSAP } from "./gsap";

type SceneMode = "desktop" | "compact";

type SceneContext = {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
  mode: SceneMode;
};

type SceneSetup = (context: SceneContext) => void | (() => void);

export function useScrollScene<T extends HTMLElement>(setup: SceneSetup) {
  const scope = useRef<T>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      if (reducedMotion) return;

      const media = gsap.matchMedia();
      media.add("(min-width: 64rem)", () => setup({ gsap, ScrollTrigger, mode: "desktop" }));
      media.add("(max-width: 63.999rem)", () => setup({ gsap, ScrollTrigger, mode: "compact" }));

      return () => media.revert();
    },
    { scope, dependencies: [Boolean(reducedMotion)], revertOnUpdate: true },
  );

  return scope;
}
