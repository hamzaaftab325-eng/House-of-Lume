"use client";

import { CatalogueError } from "@/components/catalogue/catalogue-error";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <CatalogueError reset={reset} />;
}
