"use client";

import { RotateCcw } from "lucide-react";

import { LumeButton } from "@/components/ui/controls";
import styles from "@/components/product/product-detail.module.css";

export default function ProductError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className={styles.errorPage}>
      <p>House of Lume</p>
      <h1>This object could not be prepared.</h1>
      <span>The catalogue is still available. Retry the product view when you’re ready.</span>
      <LumeButton onClick={reset}>
        <RotateCcw aria-hidden="true" /> Retry product
      </LumeButton>
    </main>
  );
}
