"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { TextField } from "@/components/ui/forms";
import { DwelluneButton } from "@/components/ui/controls";
import { safeAccountRedirect } from "@/lib/account";
import styles from "./account.module.css";
import { broadcastAccountChange } from "./session-events";

export type AuthMode = "signin" | "signup" | "reset" | "resend" | "recover" | "password" | "email";
export function AuthForm({
  mode,
  next,
  emailReady,
}: {
  mode: AuthMode;
  next?: string;
  emailReady: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [challenge, setChallenge] = useState(false);
  const labels: Record<AuthMode, string> = {
    signin: "Sign in",
    signup: "Create account",
    reset: "Send recovery email",
    resend: "Resend verification",
    recover: "Save new password",
    password: "Change password",
    email: "Change email",
  };
  const blocked = !emailReady && ["reset", "email"].includes(mode);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    setFailed(false);
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, ...values }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(typeof data.error === "string" ? data.error : "Please try again.");
      if (mode === "signin" || (mode === "signup" && data.authenticated === true)) {
        broadcastAccountChange();
        window.location.assign(safeAccountRedirect(next));
        return;
      }
      setMessage(data.message);
      if (mode === "recover") {
        router.replace("/auth/signin" as Route);
        router.refresh();
      }
      form.reset();
    } catch (error) {
      setFailed(true);
      setMessage(
        error instanceof Error && error.name !== "TimeoutError"
          ? error.message
          : "The request timed out. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  async function requestCode() {
    setPending(true);
    setFailed(false);
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reauthenticate" }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setChallenge(true);
      setMessage(data.message);
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      {blocked ? (
        <p className={styles.message}>
          Account email delivery is being prepared. This action will open when verification emails
          are ready.
        </p>
      ) : null}
      <form className={styles.form} onSubmit={submit} aria-busy={pending}>
        {mode === "signup" ? (
          <TextField
            name="name"
            label="Full name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
          />
        ) : null}
        {["signin", "signup", "reset", "resend", "email"].includes(mode) ? (
          <TextField
            name="email"
            label={mode === "email" ? "New email address" : "Email address"}
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        ) : null}
        {["password", "email"].includes(mode) ? (
          <TextField
            name="currentPassword"
            label="Current password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
          />
        ) : null}
        {["signin", "signup", "recover", "password"].includes(mode) ? (
          <TextField
            name="password"
            label={mode === "signin" ? "Password" : "New password"}
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={mode === "signin" ? 1 : 12}
            maxLength={128}
            hint={mode === "signin" ? undefined : "Use at least 12 characters."}
          />
        ) : null}
        {["recover", "password"].includes(mode) ? (
          <TextField
            name="confirm"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
          />
        ) : null}
        {challenge ? (
          <TextField
            name="nonce"
            label="Email verification code"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={12}
            required
          />
        ) : null}
        <DwelluneButton disabled={pending || blocked} type="submit">
          {pending ? "Please wait…" : labels[mode]}
        </DwelluneButton>
        {message ? (
          <p
            role={failed ? "alert" : "status"}
            className={`${styles.message} ${failed ? styles.error : ""}`}
          >
            {message}
          </p>
        ) : null}
      </form>
      {["recover", "password"].includes(mode) && emailReady ? (
        <DwelluneButton variant="quiet" disabled={pending} onClick={requestCode}>
          Request a verification code if required
        </DwelluneButton>
      ) : null}
      {mode === "signin" ? (
        <nav className={styles.actions} aria-label="Sign-in help">
          <Link href={"/auth/signup" as Route}>Create account</Link>
          <Link href={"/auth/reset" as Route}>Forgot password?</Link>
        </nav>
      ) : null}
      {mode === "signup" ? (
        <Link href={"/auth/signin" as Route}>Already have an account? Sign in</Link>
      ) : null}
      <Link href="/shop">Continue browsing</Link>
    </>
  );
}
