"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/server/logger";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message: string;
};

const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(320),
  website: z.string().max(0).optional(),
});

export async function subscribeToNewsletter(
  _previousState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    website: formData.get("website") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check your email address and try again.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({
    email: parsed.data.email,
    source: "homepage",
    status: "subscribed",
  });

  if (error?.code === "23505") {
    return {
      status: "success",
      message: "You’re already on the House of Lume list.",
    };
  }

  if (error) {
    logger.error("newsletter.subscription_failed", {
      code: error.code,
      message: error.message,
    });
    return {
      status: "error",
      message: "We couldn’t save your subscription. Please try again.",
    };
  }

  return {
    status: "success",
    message: "Welcome to the House of Lume journal.",
  };
}
