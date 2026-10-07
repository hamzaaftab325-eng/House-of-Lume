"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";

import { subscribeToNewsletter, type NewsletterState } from "@/app/(store)/actions";

import styles from "./newsletter-form.module.css";

const initialState: NewsletterState = { status: "idle", message: "" };

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState);

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.control}>
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Enter your email address"
          required
          aria-describedby={state.message ? "newsletter-status" : undefined}
        />
        <input
          className={styles.honeypot}
          aria-hidden="true"
          autoComplete="off"
          name="website"
          tabIndex={-1}
          type="text"
        />
        <button type="submit" disabled={pending} aria-label="Join the House of Lume journal">
          <span>{pending ? "Joining…" : "Subscribe"}</span>
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
      {state.message ? (
        <p
          className={styles.status}
          data-status={state.status}
          id="newsletter-status"
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
