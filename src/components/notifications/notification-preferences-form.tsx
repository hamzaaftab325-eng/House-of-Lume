"use client";
import { useRef, useState, type FormEvent } from "react";
import { CheckboxField } from "@/components/ui/forms";
import { DwelluneButton } from "@/components/ui/controls";
import { preferenceSchema, type NotificationPreferences } from "@/lib/notification-controls";
import styles from "@/components/account/account.module.css";
export function NotificationPreferencesForm({
  preferences,
}: {
  preferences: NotificationPreferences;
}) {
  const [product, setProduct] = useState(preferences.productUpdates);
  const [marketing, setMarketing] = useState(preferences.emailMarketing);
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [message, setMessage] = useState("");
  const attempt = useRef<{ productUpdates: boolean; emailMarketing: boolean } | null>(null);
  const lock = useRef(false);
  async function save(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setMessage("");
    const values = attempt.current ?? { productUpdates: product, emailMarketing: marketing };
    attempt.current = values;
    try {
      const r = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: AbortSignal.timeout(15000),
      });
      const data: unknown = await r.json();
      if (!r.ok || !preferenceSchema.safeParse(data).success) {
        if (r.status >= 500 || r.ok) {
          setUncertain(true);
          setMessage("We could not confirm the save. Retry the same preferences.");
        } else {
          attempt.current = null;
          setUncertain(false);
          setMessage("Preferences could not be saved. Check your session and retry.");
        }
        return;
      }
      attempt.current = null;
      setUncertain(false);
      setMessage("Notification preferences saved.");
    } catch {
      setUncertain(true);
      setMessage("We could not confirm the save. Retry the same preferences.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <form className={styles.form} onSubmit={save}>
      <fieldset disabled={pending || uncertain}>
        <legend>Optional notifications</legend>
        <CheckboxField
          label="Product updates in my notification inbox"
          description="Applies when product subscriptions and back-in-stock updates become available."
          checked={product}
          onChange={(e) => setProduct(e.target.checked)}
        />
        <CheckboxField
          label="Allow marketing emails"
          description="Records your consent. This does not start a marketing campaign."
          checked={marketing}
          onChange={(e) => setMarketing(e.target.checked)}
        />
      </fieldset>
      <p className={styles.intro}>
        Essential order, verification and account updates remain enabled. Marketing consent does not
        disable transactional emails.
      </p>
      <DwelluneButton
        disabled={pending}
        type={uncertain ? "button" : "submit"}
        onClick={uncertain ? () => void save() : undefined}
      >
        {pending
          ? "Saving…"
          : uncertain
            ? "Retry same preferences"
            : "Save notification preferences"}
      </DwelluneButton>
      {message ? (
        <p role="status" aria-live="polite" className={styles.message}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
