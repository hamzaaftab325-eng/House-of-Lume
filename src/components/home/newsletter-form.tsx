"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";

import {
  subscribeToNewsletter,
  type NewsletterState,
} from "@/app/(store)/actions";

import styles from "./newsletter-form.module.css";

const initialState: NewsletterState = {
  status: "idle",
  message: "",
};

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState);

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.fieldWrap}>
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          className={styles.input}
          id="newsletter-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Enter your email"
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
      </div>
      <button className={styles.submit} type="submit" disabled={pending}>
        <span>{pending ? "Joining…" : "Join the journal"}</span>
        <ArrowRight aria-hidden="true" />
      </button>
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
