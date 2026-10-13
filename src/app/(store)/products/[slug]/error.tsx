"use client";

import { RotateCcw } from "lucide-react";

import { DwelluneButton } from "@/components/ui/controls";

import styles from "./product-route.module.css";

export default function ProductError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className={styles.errorPage}>
      <p>DWELLUNE</p>
      <h1>This object could not be prepared.</h1>
      <span>The catalogue is still available. Retry the product view when you’re ready.</span>
      <DwelluneButton onClick={reset}>
        <RotateCcw aria-hidden="true" /> Retry product
      </DwelluneButton>
    </main>
  );
}
