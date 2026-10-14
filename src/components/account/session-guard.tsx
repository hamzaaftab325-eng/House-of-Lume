"use client";
import { useEffect, useState } from "react";
import { broadcastAccountChange } from "./session-events";
import { DwelluneButton } from "@/components/ui/controls";

export function AccountSessionGuard({
  customerId,
  children,
}: {
  customerId: string;
  children: React.ReactNode;
}) {
  const [valid, setValid] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    let generation = 0;
    const controller = new AbortController();
    async function check() {
      const version = ++generation;
      if (document.visibilityState === "hidden") {
        setValid(false);
        return;
      }
      try {
        const r = await fetch("/api/account", {
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        if (!alive || version !== generation) return;
        if (r.status === 401) {
          window.location.replace("/auth/signin");
          return;
        }
        if (!r.ok) {
          setValid(false);
          return;
        }
        const data = await r.json();
        if (!alive || version !== generation) return;
        if (data.customerId !== customerId) {
          setValid(false);
          window.location.reload();
          return;
        }
        setValid(true);
      } catch {
        if (alive && version === generation) setValid(false);
      }
    }
    const channel =
      typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("dwellune-account") : null;
    broadcastAccountChange();
    void check();
    const invalidate = () => {
      setValid(false);
      void check();
    };
    if (channel) channel.onmessage = invalidate;
    const onVisibility = () => {
      void check();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "dwellune-auth-change") invalidate();
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void check();
    }, 60000);
    return () => {
      alive = false;
      controller.abort();
      channel?.close();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(timer);
    };
  }, [customerId, retry]);
  return (
    <>
      <div hidden={!valid}>{children}</div>
      {!valid ? (
        <div role="status">
          <p>Verifying your account session…</p>
          <DwelluneButton variant="quiet" onClick={() => setRetry((value) => value + 1)}>
            Retry session check
          </DwelluneButton>
        </div>
      ) : null}
    </>
  );
}
