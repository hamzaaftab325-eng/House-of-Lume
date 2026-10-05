"use client";

import { useState } from "react";
import { Bell, Heart } from "lucide-react";

import { useScrollScene } from "@/lib/motion/use-scroll-scene";
import { useSplitText } from "@/lib/motion/use-split-text";
import { Accordion, AccordionItem, LumeDialog, Tabs } from "@/components/ui/overlays";
import { CheckboxField, RadioGroup, SelectField, TextAreaField, TextField } from "@/components/ui/forms";
import { IconButton, LumeButton, LumeLink } from "@/components/ui/controls";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

import styles from "./showcase.module.css";

export function InteractiveShowcase() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { pushToast } = useToast();
  const splitHeadingRef = useSplitText<HTMLHeadingElement>("lines,words");

  return (
    <>
      <section className={styles.section} aria-labelledby="controls-title">
        <div className="site-shell">
          <div className={styles.sectionHeader}>
            <p className={styles.sectionKicker}>Control language</p>
            <h2 ref={splitHeadingRef} className={styles.sectionTitle} id="controls-title">Light behavior, not button gimmicks.</h2>
            <p className={styles.sectionCopy}>Stable labels, architectural lines, high-contrast fills, large hit areas, and hover reveals that never chase the pointer.</p>
          </div>
          <div className={styles.controlRow}>
            <LumeButton showArrow>Explore collection</LumeButton>
            <LumeButton variant="frame" showArrow>View materials</LumeButton>
            <LumeButton variant="quiet">Quiet action</LumeButton>
            <LumeLink href="/#lighting">Explore lighting</LumeLink>
            <IconButton label="Save example object" icon={<Heart />} emphasis="soft" />
          </div>
          <div className={styles.badgeRow}>
            <StatusBadge tone="success">In stock</StatusBadge>
            <StatusBadge tone="warning">Verification pending</StatusBadge>
            <StatusBadge tone="info">Shipped</StatusBadge>
            <StatusBadge tone="error">Delivery failed</StatusBadge>
            <StatusBadge tone="bronze">Curated</StatusBadge>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="interaction-title">
        <div className="site-shell">
          <div className={styles.sectionHeader}>
            <p className={styles.sectionKicker}>Interaction foundations</p>
            <h2 className={styles.sectionTitle} id="interaction-title">Accessible behavior is part of the visual system.</h2>
          </div>
          <div className={styles.interactionGrid}>
            <div className={styles.panel}>
              <Tabs
                label="Material notes"
                items={[
                  { id: "bronze", label: "Bronze", content: <p>Warm metal with controlled reflectivity and deep evening contrast.</p> },
                  { id: "linen", label: "Linen", content: <p>Soft fiber texture used to diffuse light without becoming decorative noise.</p> },
                  { id: "olive", label: "Olive", content: <p>Botanical tone reserved for living content and positive states.</p> },
                ]}
              />
            </div>
            <div className={styles.panel}>
              <Accordion>
                <AccordionItem title="Why native dialog?" defaultOpen>Modern dialog semantics give us focus trapping, Escape behavior, and assistive-technology support without shipping a fragile custom focus manager.</AccordionItem>
                <AccordionItem title="Why no magnetic buttons?">Pointer attraction adds movement but no commerce value. House of Lume uses stable controls with deliberate fill and line reveals.</AccordionItem>
              </Accordion>
            </div>
          </div>
          <div className={styles.controlRow}>
            <LumeButton variant="frame" onClick={() => setDialogOpen(true)}>Open dialog</LumeButton>
            <LumeButton
              variant="quiet"
              onClick={() => pushToast({ title: "Saved to the system", message: "This toast is transient feedback; persistent notifications stay in the notification platform.", tone: "success" })}
            >
              <Bell size={16} aria-hidden="true" />
              Test toast
            </LumeButton>
          </div>
        </div>
      </section>

      <LumeDialog open={dialogOpen} onOpenChange={setDialogOpen} eyebrow="Native modal plane" title="A calm interruption." description="Focus is contained while open and restored when the dialog closes.">
        <p>Drawers, search, and confirmation surfaces share this native-accessible modal foundation instead of each inventing its own focus system.</p>
      </LumeDialog>
    </>
  );
}

export function FormShowcase() {
  return (
    <section className={styles.section} aria-labelledby="forms-title">
      <div className="site-shell">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>Form system</p>
          <h2 className={styles.sectionTitle} id="forms-title">Fast to scan, hard to misunderstand.</h2>
          <p className={styles.sectionCopy}>Persistent labels, real input types, autocomplete-ready fields, clear hints, and native controls keep checkout and account work dependable.</p>
        </div>
        <form className={styles.formGrid} onSubmit={(event) => event.preventDefault()}>
          <TextField label="Full name" name="name" autoComplete="name" placeholder="Your name" required />
          <TextField label="Phone" name="phone" type="tel" autoComplete="tel" placeholder="03XX XXXXXXX" hint="Used for delivery coordination." required />
          <SelectField label="Province" name="province" defaultValue="punjab" options={[{ label: "Punjab", value: "punjab" }, { label: "Sindh", value: "sindh" }, { label: "Khyber Pakhtunkhwa", value: "kpk" }, { label: "Balochistan", value: "balochistan" }]} />
          <TextAreaField label="Delivery instructions" name="instructions" optional placeholder="Landmark, gate, or useful delivery note" />
          <CheckboxField label="Send order updates on WhatsApp" description="Operational order updates only; marketing remains opt-in separately." defaultChecked />
          <RadioGroup legend="Payment method" name="payment" defaultValue="cod" options={[{ label: "Cash on Delivery", value: "cod", description: "Pay when your order arrives. No online payment is collected." }]} />
        </form>
      </div>
    </section>
  );
}

export function ScrollScrubShowcase() {
  const sceneRef = useScrollScene<HTMLDivElement>(({ gsap, mode }) => {
    gsap.fromTo(
      "[data-lume-scrub-line]",
      { scaleX: mode === "desktop" ? 0.08 : 0.18 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-lume-scrub-scene]",
          start: "top 72%",
          end: "bottom 42%",
          scrub: mode === "desktop" ? 0.6 : 0.25,
        },
      },
    );
  });

  return (
    <section ref={sceneRef} className={styles.scrubScene} data-lume-scrub-scene aria-labelledby="scrub-title">
      <div className="site-shell">
        <div className={styles.scrubSticky}>
          <p className={styles.sectionKicker}>ScrollTrigger infrastructure</p>
          <h2 className={styles.scrubTitle} id="scrub-title">Scroll moves the story, not the interface.</h2>
          <div className={styles.scrubTrack} aria-hidden="true"><div className={styles.scrubLine} data-lume-scrub-line /></div>
          <p className={styles.sectionCopy}>This scrub scene uses one owned transform, responsive timing, automatic GSAP cleanup, Lenis synchronization, and a static reduced-motion fallback.</p>
        </div>
      </div>
    </section>
  );
}
