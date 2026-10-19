"use client";
import { useEffect, useState } from "react";
import { broadcastAccountChange } from "./session-events";
import { DwelluneButton } from "@/components/ui/controls";

type SessionGuardProps = { children: React.ReactNode } & (
  | {
      customerId: string;
      userId?: never;
      sessionEndpoint?: "/api/account" | "/api/notifications?audience=customer&summary=1";
    }
  | { userId: string; customerId?: never; sessionEndpoint: "/api/admin/session" }
);

export function AccountSessionGuard(props: SessionGuardProps) {
  const { children, sessionEndpoint = "/api/account" } = props;
  const identityId = props.userId ?? props.customerId;
  const identityKey = props.userId ? "userId" : "customerId";
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
        const r = await fetch(sessionEndpoint, {
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
        if (data[identityKey] !== identityId) {
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
  }, [identityId, identityKey, retry, sessionEndpoint]);
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
