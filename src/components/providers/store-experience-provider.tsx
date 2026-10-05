"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { MotionConfig, useReducedMotion } from "motion/react";

import { gsap, registerGsap, ScrollTrigger } from "@/lib/motion/gsap";
import { ToastProvider } from "@/components/ui/toast";

export function StoreExperienceProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";

    if (reducedMotion) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      return;
    }

    registerGsap();

    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.095,
      wheelMultiplier: 0.9,
    });
    const onScroll = () => ScrollTrigger.update();
    const onTick = (time: number) => lenis.raf(time * 1000);

    lenis.on("scroll", onScroll);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    lenisRef.current = lenis;

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      lenisRef.current?.resize();
      ScrollTrigger.refresh();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}>
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
