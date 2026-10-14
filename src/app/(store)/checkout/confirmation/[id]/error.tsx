"use client";
import { DwelluneButton } from "@/components/ui/controls";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="foundation-page">
      <div className="site-shell">
        <h1>Order confirmation is temporarily unavailable.</h1>
        <p role="alert">Do not place another order. Retry to view your saved confirmation.</p>
        <DwelluneButton onClick={reset}>Retry</DwelluneButton>
      </div>
    </main>
  );
}
