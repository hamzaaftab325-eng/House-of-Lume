"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DwelluneButton } from "@/components/ui/controls";
import { CheckboxField, SelectField, TextField } from "@/components/ui/forms";
import {
  addressSchema,
  profileSchema,
  type AccountAction,
  type Address,
  type Customer,
  type OrderItem,
  type ReturnPolicy,
} from "@/lib/account";
import styles from "./account.module.css";
import { broadcastAccountChange } from "./session-events";

async function mutate(action: AccountAction) {
  const r = await fetch("/api/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
    signal: AbortSignal.timeout(15000),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Please try again.");
}
function useAccountMutation() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  async function run(action: AccountAction) {
    if (pending) return false;
    setPending(true);
    setMessage("");
    setError(false);
    try {
      await mutate(action);
      setMessage("Your change has been saved.");
      router.refresh();
      return true;
    } catch (e) {
      setError(true);
      setMessage(
        e instanceof Error && e.name !== "TimeoutError"
          ? e.message
          : "The request timed out. Please try again.",
      );
      return false;
    } finally {
      setPending(false);
    }
  }
  return { pending, message, error, run };
}
function Feedback({ message, error }: { message: string; error: boolean }) {
  return message ? (
    <p
      className={`${styles.message} ${error ? styles.error : ""}`}
      role={error ? "alert" : "status"}
    >
      {message}
    </p>
  ) : null;
}
export function ProfileForm({ customer }: { customer: Customer }) {
  const state = useAccountMutation();
  const [validation, setValidation] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = profileSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      setValidation(parsed.error.issues[0].message);
      return;
    }
    setValidation("");
    void state.run({ action: "profile", values: parsed.data });
  }
  return (
    <form className={styles.form} onSubmit={submit} aria-busy={state.pending}>
      <TextField
        name="name"
        label="Full name"
        required
        minLength={2}
        maxLength={100}
        autoComplete="name"
        defaultValue={customer.full_name ?? ""}
      />
      <TextField
        name="phone"
        label="Phone number"
        type="tel"
        autoComplete="tel"
        optional
        defaultValue={customer.phone ?? ""}
        maxLength={20}
      />
      <TextField
        name="whatsapp"
        label="WhatsApp contact number"
        type="tel"
        optional
        defaultValue={customer.whatsapp_number ?? ""}
        maxLength={20}
        hint="Saved as contact information; automated WhatsApp messages are not available yet."
      />
      <DwelluneButton disabled={state.pending} type="submit">
        {state.pending ? "Saving…" : "Save profile"}
      </DwelluneButton>
      {validation ? <p role="alert">{validation}</p> : null}
      <Feedback {...state} />
    </form>
  );
}
export function AddressForm({ address, onDone }: { address?: Address; onDone?: () => void }) {
  const state = useAccountMutation();
  const [validation, setValidation] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const parsed = addressSchema.safeParse({
      ...Object.fromEntries(data),
      default: data.has("default"),
      ...(address ? { id: address.id } : {}),
    });
    if (!parsed.success) {
      setValidation(parsed.error.issues[0].message);
      return;
    }
    setValidation("");
    if (await state.run({ action: "address", values: parsed.data })) {
      if (!address) form.reset();
      onDone?.();
    }
  }
  return (
    <form className={styles.form} onSubmit={submit} aria-busy={state.pending}>
      <TextField
        name="label"
        label="Address label"
        optional
        maxLength={50}
        defaultValue={address?.label ?? ""}
      />
      <TextField
        name="recipient"
        label="Recipient name"
        autoComplete="shipping name"
        required
        minLength={2}
        maxLength={100}
        defaultValue={address?.recipient_name ?? ""}
      />
      <TextField
        name="phone"
        label="Delivery phone"
        autoComplete="shipping tel"
        type="tel"
        required
        maxLength={20}
        defaultValue={address?.phone ?? ""}
      />
      <TextField
        name="line1"
        label="Street address"
        autoComplete="shipping address-line1"
        required
        minLength={5}
        maxLength={200}
        defaultValue={address?.address_line1 ?? ""}
      />
      <TextField
        name="line2"
        label="Apartment or additional address"
        autoComplete="shipping address-line2"
        optional
        maxLength={200}
        defaultValue={address?.address_line2 ?? ""}
      />
      <TextField
        name="city"
        label="City"
        autoComplete="shipping address-level2"
        required
        minLength={2}
        maxLength={80}
        defaultValue={address?.city ?? ""}
      />
      <SelectField
        name="province"
        label="Province or territory"
        autoComplete="shipping address-level1"
        required
        defaultValue={address?.province ?? ""}
        options={[
          { label: "Select province or territory", value: "" },
          ...addressSchema.shape.province.options.map((value) => ({ label: value, value })),
        ]}
      />
      <TextField
        name="postalCode"
        label="Postal code"
        autoComplete="shipping postal-code"
        inputMode="numeric"
        optional
        pattern="[0-9]{5}"
        maxLength={5}
        defaultValue={address?.postal_code ?? ""}
      />
      <p>Country: Pakistan</p>
      <CheckboxField
        name="default"
        label="Use as my default address"
        defaultChecked={address?.is_default}
      />
      <DwelluneButton type="submit" disabled={state.pending}>
        {state.pending ? "Saving…" : address ? "Save address" : "Add address"}
      </DwelluneButton>
      {validation ? <p role="alert">{validation}</p> : null}
      <Feedback {...state} />
    </form>
  );
}
export function AddressEntry({ address }: { address: Address }) {
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const state = useAccountMutation();
  return (
    <section className={styles.section}>
      <h2>
        {address.label || address.recipient_name}
        {address.is_default ? " · Default" : ""}
      </h2>
      <p>
        {address.recipient_name} · {address.phone}
      </p>
      <p>
        {[
          address.address_line1,
          address.address_line2,
          address.city,
          address.province,
          address.postal_code,
        ]
          .filter(Boolean)
          .join(", ")}
      </p>
      <div className={styles.actions}>
        <DwelluneButton variant="quiet" onClick={() => setEditing(!editing)}>
          {editing ? "Cancel editing" : "Edit address"}
        </DwelluneButton>
        <DwelluneButton
          variant="quiet"
          disabled={state.pending}
          onClick={() => setConfirm(!confirm)}
        >
          Remove address
        </DwelluneButton>
      </div>
      {confirm ? (
        <div>
          <p>Remove this saved address? Existing order addresses will be kept.</p>
          <div className={styles.actions}>
            <DwelluneButton
              disabled={state.pending}
              onClick={() => void state.run({ action: "deleteAddress", id: address.id })}
            >
              Confirm removal
            </DwelluneButton>
            <DwelluneButton variant="quiet" onClick={() => setConfirm(false)}>
              Keep address
            </DwelluneButton>
          </div>
        </div>
      ) : null}
      {editing ? <AddressForm address={address} onDone={() => setEditing(false)} /> : null}
      <Feedback {...state} />
    </section>
  );
}
export function AccountActionButton({
  action,
  children,
}: {
  action: AccountAction;
  children: React.ReactNode;
}) {
  const state = useAccountMutation();
  return (
    <div>
      <DwelluneButton
        variant="quiet"
        disabled={state.pending}
        onClick={() => void state.run(action)}
      >
        {state.pending ? "Saving…" : children}
      </DwelluneButton>
      <Feedback {...state} />
    </div>
  );
}
export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function signout() {
    setPending(true);
    setError("");
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signout" }),
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) throw new Error();
      broadcastAccountChange();
      window.location.replace("/auth/signin");
    } catch {
      setError("We could not sign you out. Please try again.");
      setPending(false);
    }
  }
  return (
    <div>
      <DwelluneButton variant="frame" disabled={pending} onClick={() => void signout()}>
        {pending ? "Signing out…" : "Sign out of all sessions"}
      </DwelluneButton>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
export function ReturnRequestForm({
  orderId,
  items,
  policy,
}: {
  orderId: string;
  items: OrderItem[];
  policy: ReturnPolicy;
}) {
  const state = useAccountMutation();
  const [requestId] = useState(() => crypto.randomUUID());
  const [submitted, setSubmitted] = useState(false);
  const [validation, setValidation] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitted || state.pending) return;
    const data = new FormData(e.currentTarget);
    const selected = items
      .map((item) => ({ id: item.id, quantity: Number(data.get(item.id) ?? 0) }))
      .filter((item) => item.quantity > 0);
    if (!selected.length) {
      setValidation("Choose at least one item and quantity to return.");
      return;
    }
    setValidation("");
    const saved = await state.run({
      action: "return",
      requestId,
      orderId,
      reason: String(data.get("reason")),
      detail: String(data.get("detail") ?? ""),
      items: selected,
    });
    if (saved) setSubmitted(true);
  }
  return (
    <form className={styles.form} onSubmit={submit} aria-busy={state.pending}>
      <h2>Request a return</h2>
      <p>
        Eligible items may be requested within {policy.window_days} days of delivery.{" "}
        {policy.refund_procedure}
      </p>
      {items.map((item) => (
        <TextField
          key={item.id}
          name={item.id}
          label={`${item.product_name} — quantity to return`}
          type="number"
          min={0}
          max={item.quantity}
          defaultValue={0}
        />
      ))}
      <SelectField
        name="reason"
        label="Return reason"
        options={policy.reason_codes.map((value) => ({ label: value.replaceAll("_", " "), value }))}
        required
      />
      <TextField name="detail" label="Additional details" optional maxLength={2000} />
      <DwelluneButton type="submit" disabled={state.pending || submitted}>
        {submitted
          ? "Return request received"
          : state.pending
            ? "Submitting…"
            : "Submit return request"}
      </DwelluneButton>
      {validation ? <p role="alert">{validation}</p> : null}
      <Feedback {...state} />
    </form>
  );
}
