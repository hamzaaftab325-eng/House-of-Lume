import type { Metadata } from "next";
import { Heart } from "lucide-react";

import { DemoLampArt, DemoObjectArt, DemoPlantArt, EditorialChapter, MaterialStory, ProductStage, ProductUnit, RoomStory, ShelfGrid, SplitPlane } from "@/components/editorial/editorial";
import { InteractiveShowcase, FormShowcase, ScrollScrubShowcase } from "@/components/design-system/interactive-showcase";
import { IconButton, LumeLink } from "@/components/ui/controls";

import styles from "@/components/design-system/showcase.module.css";

export const metadata: Metadata = {
  title: "Design System",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <div className="site-shell">
          <p className={styles.kicker}>Luminous Domesticity · v2.1 implementation</p>
          <h1 className={styles.title}>A showroom, not a template.</h1>
          <div className={styles.introMeta}>
            <span>WCAG 2.2 AA baseline</span>
            <span>No authored inline styles</span>
            <span>Responsive from 320px to wide desktop</span>
          </div>
        </div>
      </section>

      <section className={styles.section} id="object-stages" aria-labelledby="stages-title">
        <div className="site-shell">
          <div className={styles.sectionHeader}>
            <p className={styles.sectionKicker}>Product language</p>
            <h2 className={styles.sectionTitle} id="stages-title">Objects occupy space instead of living inside cards.</h2>
            <p className={styles.sectionCopy}>The same data can enter a shelf, editorial pair, material study, room feature, or quiet grid without re-inventing the product metadata pattern.</p>
          </div>
          <ShelfGrid>
            <ProductUnit index="01" name="Nocturne Reading Lamp" context="Aged bronze · 2700K" price="PKR 18,500" label="Lighting" tone="paper" action={<IconButton label="Save lamp" icon={<Heart />} emphasis="soft" />}><DemoLampArt /></ProductUnit>
            <ProductUnit index="02" name="Olive Ficus Study" context="Medium · Clay planter" price="PKR 7,200" label="Living Green" tone="olive" action={<IconButton label="Save plant" icon={<Heart />} emphasis="soft" />}><DemoPlantArt /></ProductUnit>
            <ProductUnit index="03" name="Dune Vessel" context="Sand ceramic · Hand finish" price="PKR 4,800" label="Object" tone="chalk" action={<IconButton label="Save vessel" icon={<Heart />} emphasis="soft" />}><DemoObjectArt /></ProductUnit>
          </ShelfGrid>
        </div>
      </section>

      <section className={styles.section}>
        <div className="editorial-shell">
          <EditorialChapter eyebrow="Editorial Chapter" title="Light changes the room before it changes the object." body="Phase 3 will choreograph real product and room imagery through this composition. The component already preserves hierarchy, readable measure, and a non-card editorial rhythm." action={<LumeLink href="/#lighting">Explore lighting</LumeLink>} media={<ProductStage ratio="landscape" tone="ink" label="Evening light"><DemoLampArt /></ProductStage>} />
        </div>
      </section>

      <SplitPlane
        secondaryTone="olive"
        primary={<MaterialStory eyebrow="Material Study" title="Texture belongs close to the object." body="Material stories pair tactile context with product meaning rather than adding another promotional tile." media={<ProductStage ratio="landscape" tone="chalk"><DemoObjectArt /></ProductStage>} />}
        secondary={<div><p className={styles.sectionKicker}>Split Plane</p><h2 className={styles.sectionTitle}>Contrast creates hierarchy without another container.</h2><p className={styles.sectionCopy}>Canvas, ink, olive, imagery, and type can become the layout itself.</p></div>}
      />

      <section className={styles.section}>
        <div className="editorial-shell">
          <RoomStory eyebrow="Room Story" title="Context can stay cinematic and shoppable." body="Room features keep product links accessible while allowing image-led storytelling. The dark plane is purposeful, not a site-wide luxury cliché." media={<ProductStage ratio="landscape" tone="paper"><DemoPlantArt /></ProductStage>} />
        </div>
      </section>

      <InteractiveShowcase />
      <FormShowcase />
      <ScrollScrubShowcase />
    </main>
  );
}
