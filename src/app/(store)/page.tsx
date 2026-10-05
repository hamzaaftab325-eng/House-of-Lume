import { Heart } from "lucide-react";

import { DemoLampArt, DemoObjectArt, DemoPlantArt, ProductUnit, ShelfGrid } from "@/components/editorial/editorial";
import { IconButton, LumeButtonLink, LumeLink } from "@/components/ui/controls";

import styles from "./page.module.css";

export default function StorefrontHomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="site-shell">
          <p className={styles.kicker}>House of Lume · Phase 2 system preview</p>
          <h1 className={styles.title}>Objects for a warmer home.</h1>
          <p className={styles.copy}>The production design language is now componentized: products live on stages instead of cards, controls use stable light reveals, overlays are native-accessible, and the motion layer is ready for Phase 3 storytelling.</p>
          <div className={styles.actions}>
            <LumeButtonLink href="/system" showArrow>Explore the system</LumeButtonLink>
            <LumeLink href="/account">Customer account</LumeLink>
          </div>
        </div>
      </section>

      <section className={styles.preview} aria-labelledby="preview-title">
        <div className="site-shell">
          <div className={styles.previewHeader}>
            <p className={styles.kicker}>Object Stage</p>
            <h2 className={styles.previewTitle} id="preview-title">No repeated rounded ecommerce cards.</h2>
            <p className={styles.previewCopy}>Each object occupies a material plane with spatially stable metadata, deliberate crop behavior, and a quiet baseline shared across the shelf.</p>
          </div>
          <ShelfGrid>
            <div id="lighting"><ProductUnit index="01" name="Nocturne Reading Lamp" context="Aged bronze · Warm light" price="PKR 18,500" label="Lighting" tone="paper" action={<IconButton label="Save Nocturne Reading Lamp" icon={<Heart />} emphasis="soft" />}><DemoLampArt /></ProductUnit></div>
            <div id="plants"><ProductUnit index="02" name="Olive Ficus Study" context="Living green · Clay pot" price="PKR 7,200" label="Living Green" tone="olive" action={<IconButton label="Save Olive Ficus Study" icon={<Heart />} emphasis="soft" />}><DemoPlantArt /></ProductUnit></div>
            <div id="objects"><ProductUnit index="03" name="Dune Vessel" context="Hand-finished ceramic" price="PKR 4,800" label="Objects" tone="chalk" action={<IconButton label="Save Dune Vessel" icon={<Heart />} emphasis="soft" />}><DemoObjectArt /></ProductUnit></div>
          </ShelfGrid>
        </div>
      </section>
    </main>
  );
}
