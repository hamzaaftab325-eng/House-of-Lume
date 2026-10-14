import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export async function passwordSignUp(email: string, password: string, name: string) {
  let config: unknown;
  try {
    const settings = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!settings.ok) throw new Error("signup_configuration_unavailable");
    config = await settings.json();
  } catch {
    throw new Error("signup_configuration_unavailable");
  }
  if (
    typeof config !== "object" ||
    config === null ||
    !("mailer_autoconfirm" in config) ||
    config.mailer_autoconfirm !== true
  )
    throw new Error("signup_confirmation_enabled");

  // SSR clients enforce PKCE, which cannot be used with automatic confirmation.
  // The temporary password client never persists tokens; the route installs the
  // returned session through the existing SSR cookie client.
  const client = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  return client.auth.signUp({ email, password, options: { data: { full_name: name } } });
}
