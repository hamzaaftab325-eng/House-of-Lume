"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import SplitType from "split-type";

type SplitTypes = "lines" | "words" | "chars" | "lines,words" | "words,chars" | "lines,words,chars";

export function useSplitText<T extends HTMLElement>(types: SplitTypes = "lines,words") {
  const ref = useRef<T>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !ref.current) return;

    const split = new SplitType(ref.current, { types });
    return () => split.revert();
  }, [reducedMotion, types]);

  return ref;
}
