"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  policyActionSchema,
  policySchema,
  type PolicyAction,
  type VerificationPolicy,
} from "@/lib/verification";
import { DwelluneButton } from "@/components/ui/controls";
import { CheckboxField, TextAreaField, TextField } from "@/components/ui/forms";
import styles from "@/components/account/account.module.css";
import adminStyles from "./verification.module.css";
const fields = [
  { key: "highValuePkr", label: "High-value threshold (PKR)", min: 1000, max: 1_000_000 },
  { key: "duplicateWindowHours", label: "Possible duplicate window (hours)", min: 1, max: 72 },
  { key: "failedDeliveryCount", label: "Failed delivery orders before review", min: 1, max: 10 },
  {
    key: "failedDeliveryLookbackDays",
    label: "Failed delivery history window (days)",
    min: 1,
    max: 365,
  },
  { key: "maxOrders24h", label: "Maximum orders per identity in 24 hours", min: 1, max: 20 },
  { key: "maxOrdersHour", label: "Maximum orders per identity in one hour", min: 1, max: 10 },
] as const;
export function VerificationPolicyForm({ policy }: { policy: VerificationPolicy }) {
  const router = useRouter();
  const [required, setRequired] = useState(policy.verificationRequired);
  const [values, setValues] = useState({
    highValuePkr: String(policy.highValuePkr),
    duplicateWindowHours: String(policy.duplicateWindowHours),
    failedDeliveryCount: String(policy.failedDeliveryCount),
    failedDeliveryLookbackDays: String(policy.failedDeliveryLookbackDays),
    maxOrders24h: String(policy.maxOrders24h),
    maxOrdersHour: String(policy.maxOrdersHour),
  });
  const [note, setNote] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const attempt = useRef<PolicyAction | null>(null);
  const lock = useRef(false);
  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (lock.current || saved || blocked) return;
    if (!attempt.current) {
      if (!reviewed) {
        setMessage("Confirm that you reviewed these rules.");
        return;
      }
      const parsed = policyActionSchema.safeParse({
        requestId: crypto.randomUUID(),
        expectedRevision: policy.revision,
        note,
        values: {
          verificationRequired: required,
          ...Object.fromEntries(fields.map((field) => [field.key, Number(values[field.key])])),
        },
      });
      if (!parsed.success) {
        setMessage(parsed.error.issues[0]?.message ?? "Check the rule values.");
        return;
      }
      attempt.current = parsed.data;
    }
    lock.current = true;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/verification-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attempt.current),
        signal: AbortSignal.timeout(20_000),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const result = z.object({ error: z.string() }).safeParse(data);
        setMessage(result.success ? result.data.error : "The result is unavailable.");
        if (response.status >= 500) setUncertain(true);
        else {
          setBlocked(true);
          setUncertain(false);
        }
        return;
      }
      const result = policySchema.safeParse(data);
      if (!result.success) {
        setUncertain(true);
        setMessage("The result is unavailable. Retry the same rule-change attempt.");
        return;
      }
      attempt.current = null;
      setUncertain(false);
      setSaved(true);
      setMessage("Rules saved. Updating details…");
      router.refresh();
    } catch {
      setUncertain(true);
      setMessage("We could not confirm whether the rules were saved. Retry the same attempt.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <form className={styles.form} onSubmit={submit}>
      <fieldset
        disabled={pending || uncertain || blocked || saved}
        className={adminStyles.fieldset}
      >
        <legend>Rules for new COD orders</legend>
        <CheckboxField
          label="Require verification for every COD order"
          description="Flagged orders always need manual review, including when this setting is off."
          checked={required}
          onChange={(event) => setRequired(event.target.checked)}
        />
        {fields.map((field) => (
          <TextField
            key={field.key}
            label={field.label}
            type="number"
            min={field.min}
            max={field.max}
            step={1}
            required
            value={values[field.key]}
            onChange={(event) =>
              setValues((previous) => ({ ...previous, [field.key]: event.target.value }))
            }
          />
        ))}
        <TextAreaField
          label="Reason for changing rules"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          minLength={3}
          maxLength={1000}
          rows={3}
          required
        />
        <CheckboxField
          label="I reviewed these rules and limits."
          checked={reviewed}
          onChange={(event) => setReviewed(event.target.checked)}
          required
        />
      </fieldset>
      <div className={styles.actions}>
        {!uncertain && !blocked && !saved ? (
          <DwelluneButton type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save verification rules"}
          </DwelluneButton>
        ) : null}
        {uncertain ? (
          <DwelluneButton disabled={pending} onClick={() => void submit()}>
            {pending ? "Retrying…" : "Retry same rule-change attempt"}
          </DwelluneButton>
        ) : null}
        {uncertain || blocked || saved ? (
          <DwelluneButton
            variant="frame"
            disabled={pending}
            onClick={() => window.location.reload()}
          >
            Reload rules
          </DwelluneButton>
        ) : null}
      </div>
      {message ? (
        <p role="status" aria-live="polite" className={styles.message}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
