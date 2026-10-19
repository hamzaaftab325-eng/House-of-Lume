"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { verificationInputSchema, type VerificationAction } from "@/lib/verification";
import { DwelluneButton } from "@/components/ui/controls";
import { CheckboxField, SelectField, TextAreaField } from "@/components/ui/forms";
import styles from "@/components/account/account.module.css";
import { z } from "zod";
import adminStyles from "./verification.module.css";
export function VerificationForm({
  orderId,
  revision,
  canVerify,
  canCancel,
  reviewStatus = "not_required",
}: {
  orderId: string;
  revision: number;
  canVerify: boolean;
  canCancel: boolean;
  reviewStatus?: string;
}) {
  const router = useRouter();
  const [action, setAction] = useState("contact");
  const [channel, setChannel] = useState("phone");
  const [outcome, setOutcome] = useState("no_response");
  const [note, setNote] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const attempt = useRef<VerificationAction | null>(null);
  const locked = useRef(false);
  const actions = [
    ...(canVerify
      ? [
          { value: "contact", label: "Record contact attempt" },
          ...(reviewStatus === "pending"
            ? [{ value: "clear_review", label: "Clear manual review" }]
            : [
                { value: "confirm", label: "Confirm order" },
                { value: "request_review", label: "Flag for manual review" },
              ]),
          ...(canCancel ? [{ value: "reject", label: "Reject order and release stock" }] : []),
        ]
      : []),
    ...(canCancel ? [{ value: "cancel", label: "Cancel order and release stock" }] : []),
  ];
  const selectedAction = actions.some((option) => option.value === action)
    ? action
    : (actions[0]?.value ?? "");
  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (locked.current || saved || blocked) return;
    if (!attempt.current) {
      if (selectedAction !== "contact" && !reviewed) {
        setMessage("Confirm that you reviewed this decision first.");
        return;
      }
      const input = verificationInputSchema.safeParse({
        action: selectedAction,
        expectedRevision: revision,
        note,
        ...(selectedAction === "contact" ? { channel, outcome } : {}),
      });
      if (!input.success) {
        setMessage(input.error.issues[0]?.message ?? "Check your action and note.");
        return;
      }
      attempt.current = {
        orderId: orderId,
        requestId: crypto.randomUUID(),
        input: input.data,
      };
    }
    locked.current = true;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attempt.current),
        signal: AbortSignal.timeout(20_000),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const error = z.object({ error: z.string() }).safeParse(body);
        setMessage(
          error.success ? error.data.error : "The result is unavailable. Retry the same attempt.",
        );
        if (response.status >= 500) setUncertain(true);
        else {
          setBlocked(true);
          setUncertain(false);
        }
        return;
      }
      // A malformed success response may follow a committed transaction. Keep its original key.
      const result = z
        .object({ id: z.uuid(), verification_revision: z.number().int() })
        .safeParse(body);
      if (!result.success || result.data.id !== orderId) {
        setUncertain(true);
        setMessage("The result is unavailable. Retry the same attempt.");
        return;
      }
      attempt.current = null;
      setUncertain(false);
      setSaved(true);
      setMessage("Action saved. Updating order details…");
      router.refresh();
    } catch {
      setUncertain(true);
      setMessage(
        "We could not confirm whether this action was saved. Retry the same attempt to avoid duplicate records.",
      );
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  if (!actions.length)
    return (
      <p className={styles.intro}>
        This order is closed or beyond the verification cancellation workflow. Its history remains
        available below.
      </p>
    );
  const disabled = pending || uncertain || blocked || saved;
  return (
    <form className={styles.form} onSubmit={submit}>
      <fieldset disabled={disabled} className={adminStyles.fieldset}>
        <legend>Record an actual contact attempt or make an order decision</legend>
        <SelectField
          label="Action"
          value={selectedAction}
          onChange={(event) => {
            setAction(event.target.value);
            setReviewed(false);
          }}
          options={actions}
        />
        {selectedAction === "contact" ? (
          <>
            <SelectField
              label="Contact method"
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              options={[
                { value: "phone", label: "Phone" },
                { value: "whatsapp", label: "WhatsApp" },
                { value: "email", label: "Email" },
                { value: "admin", label: "Manual review" },
              ]}
            />
            <SelectField
              label="Contact outcome"
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              options={[
                { value: "no_response", label: "No response" },
                { value: "reached", label: "Customer reached" },
                { value: "failed", label: "Contact failed" },
              ]}
            />
          </>
        ) : (
          <p className={styles.intro}>
            {selectedAction === "clear_review"
              ? "Review every recorded signal with the customer and record why this order can proceed. Clearing review does not confirm the order."
              : selectedAction === "request_review"
                ? "Record the concern requiring manual review. The order cannot be confirmed until review is cleared."
                : selectedAction === "confirm"
                  ? "Confirm only after reviewing the customer, delivery address and order. This does not mark COD money collected."
                  : "This closes the order and releases its active stock reservations. This decision cannot be undone here."}
          </p>
        )}
        <TextAreaField
          label="Admin verification note"
          hint="Private to administrators. Record why you are taking this action."
          value={note}
          onChange={(event) => setNote(event.target.value)}
          minLength={3}
          maxLength={2000}
          required
          rows={4}
        />
        {selectedAction !== "contact" ? (
          <CheckboxField
            label="I reviewed the order and confirm this decision."
            checked={reviewed}
            onChange={(event) => setReviewed(event.target.checked)}
            required
          />
        ) : null}
      </fieldset>
      <div className={styles.actions}>
        {!uncertain && !blocked && !saved ? (
          <DwelluneButton type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save verification action"}
          </DwelluneButton>
        ) : null}
        {uncertain ? (
          <DwelluneButton disabled={pending} onClick={() => void submit()}>
            {pending ? "Retrying…" : "Retry same action attempt"}
          </DwelluneButton>
        ) : null}
        {blocked || saved || uncertain ? (
          <DwelluneButton
            variant="frame"
            disabled={pending}
            onClick={() => window.location.reload()}
          >
            Reload order details
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
