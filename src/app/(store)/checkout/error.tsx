"use client";
import { DwelluneButton } from "@/components/ui/controls";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="foundation-page">
      <div className="site-shell">
        <h1>Checkout is temporarily unavailable.</h1>
        <p role="alert">Your bag remains saved. Please retry.</p>
        <DwelluneButton onClick={reset}>Retry</DwelluneButton>
      </div>
    </main>
  );
}
