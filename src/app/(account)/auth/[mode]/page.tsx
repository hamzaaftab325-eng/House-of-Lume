import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { AuthForm, type AuthMode } from "@/components/account/auth-form";
import styles from "@/components/account/account.module.css";
import { accountIdentity } from "@/server/account/account.service";
import { safeAccountRedirect } from "@/lib/account";
const modes: Record<string, { mode: AuthMode; title: string; intro: string }> = {
  signin: {
    mode: "signin",
    title: "Welcome home.",
    intro: "Sign in to manage your details, saved objects and orders.",
  },
  signup: {
    mode: "signup",
    title: "Make yourself at home.",
    intro: "Create your DWELLUNE account and sign in immediately. No verification email is needed.",
  },
  reset: {
    mode: "reset",
    title: "Forgot your password?",
    intro: "Request a secure recovery link for your account.",
  },
  resend: {
    mode: "resend",
    title: "Verify your email.",
    intro: "Request a fresh verification link. Check your inbox and spam folder.",
  },
  "update-password": {
    mode: "recover",
    title: "Choose a new password.",
    intro: "Open a fresh recovery link, then save your new password.",
  },
};
export const metadata: Metadata = { title: "Customer access" };
export default async function AuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { mode } = await params;
  if (mode === "resend") redirect("/auth/signin");
  if (!Object.hasOwn(modes, mode)) notFound();
  const route = modes[mode];
  if (!route) notFound();
  const query = await searchParams;
  if (mode === "signup" || mode === "signin") {
    let authenticated = false;
    try {
      await accountIdentity();
      authenticated = true;
    } catch {
      // Visitors and unavailable sessions can still use the access form.
    }
    if (authenticated)
      redirect((mode === "signup" ? "/account" : safeAccountRedirect(query.next)) as Route);
  }
  return (
    <main className={`${styles.page} ${styles.auth}`}>
      <p className={styles.eyebrow}>DWELLUNE · Your account</p>
      <h1 className={styles.title}>{route.title}</h1>
      <p className={styles.intro}>{route.intro}</p>
      <AuthForm
        mode={route.mode}
        next={query.next}
        emailReady={process.env.AUTH_EMAIL_READY === "true"}
      />
    </main>
  );
}
