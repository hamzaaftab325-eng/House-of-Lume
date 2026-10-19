"use client";
import { useRef, useState } from "react";
import { DwelluneButton } from "@/components/ui/controls";
import { preferenceSchema, type NotificationPreferences } from "@/lib/notification-controls";
import styles from "@/components/account/account.module.css";

export function NotificationSettings({ preferences }: { preferences: NotificationPreferences }) {
  const [optionalEnabled, setOptionalEnabled] = useState(
    preferences.productUpdates || preferences.emailMarketing,
  );
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);

  async function turnOff() {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setMessage("");
    try {
      const r = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Preserve consent withdrawal for existing accounts; never enable optional delivery.
        body: JSON.stringify({ productUpdates: false, emailMarketing: false }),
        signal: AbortSignal.timeout(15000),
      });
      const parsed = preferenceSchema.safeParse(await r.json());
      if (!r.ok || !parsed.success || parsed.data.productUpdates || parsed.data.emailMarketing) {
        if (r.status >= 500 || r.ok) {
          setUncertain(true);
          setMessage("We could not confirm the change. Retry turning off optional updates.");
        } else {
          setUncertain(false);
          setMessage("The change could not be saved. Check your session and retry.");
        }
        return;
      }
      setUncertain(false);
      setOptionalEnabled(false);
      setMessage("Optional updates disabled.");
    } catch {
      setUncertain(true);
      setMessage("We could not confirm the change. Retry turning off optional updates.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return (
    <section className={styles.section} aria-label="Notification settings" aria-busy={pending}>
      <p className={styles.intro}>
        Essential order, verification and account updates remain enabled.
      </p>
      {optionalEnabled ? (
        <>
          <p>
            Optional updates were previously enabled for this account. You can turn them off here.
          </p>
          <DwelluneButton disabled={pending} onClick={() => void turnOff()}>
            {pending
              ? "Saving…"
              : uncertain
                ? "Retry turning off updates"
                : "Turn off optional updates"}
          </DwelluneButton>
        </>
      ) : (
        <p>Optional updates are off.</p>
      )}
      {message ? (
        <p role="status" aria-live="polite" className={styles.message}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
