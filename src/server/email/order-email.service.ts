import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { z } from "zod";
import { env } from "@/lib/env";
import {
  emailEventSchema,
  emailTemplateVersion,
  renderOwnerTestEmail,
  renderTransactionalEmail,
} from "./templates";

export const storeEmail = "dwellunestore@gmail.com";
const jobSchema = z.object({
  id: z.uuid(),
  order_id: z.uuid(),
  lease: z.uuid(),
  payload: z.object({
    to: z.array(z.email()).length(1),
    subject: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[^\r\n]+$/),
    text: z.string().min(1).max(100_000),
    event: emailEventSchema.default("order.placed"),
  }),
});
const claimSchema = z.object({ job: jobSchema.nullable(), verify_due: z.boolean() });

// No cookies, customer session or service-role key: a scoped worker capability guards the RPC.
async function rpc(secret: string, input: Record<string, unknown>): Promise<unknown> {
  const client = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await client.rpc("order_email_worker", {
    p_secret: secret,
    p_input: input,
  });
  if (error) throw new Error("email_worker_database_unavailable");
  return data;
}

export function smtpFailure(error: unknown): "retry" | "failed" | "uncertain" {
  const result = z
    .object({
      code: z.string().optional(),
      command: z.string().optional(),
      responseCode: z.number().optional(),
    })
    .safeParse(error);
  if (!result.success) return "uncertain";
  const { code, command, responseCode } = result.data;
  if (code === "EAUTH") return "failed";
  // An explicit SMTP rejection did not accept the message. Only temporary rejection retries.
  if (responseCode && responseCode >= 400 && responseCode <= 599)
    return responseCode < 500 ? "retry" : "failed";
  // Network failure after DATA may have happened after Gmail accepted the message.
  if (["CONN", "EHLO", "HELO", "STARTTLS", "AUTH", "MAIL FROM", "RCPT TO"].includes(command ?? ""))
    return "retry";
  if (code === "EDNS") return "retry";
  return "uncertain";
}

function transporter() {
  const password = process.env.SMTP_APP_PASSWORD?.replace(/\s/g, "");
  if (!password || !/^[a-zA-Z0-9]{16}$/.test(password))
    throw new Error("smtp_configuration_missing");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: storeEmail, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });
}

export async function runOrderEmails(secret: string, action: "dispatch" | "verify" | "test") {
  const transport = transporter();
  try {
    if (action !== "dispatch") {
      try {
        await transport.verify();
      } catch {
        await rpc(secret, { action: "health", ok: false });
        throw new Error("smtp_verification_failed");
      }
      await rpc(secret, { action: "health", ok: true });
      if (action === "test") {
        // Fixed owner-controlled recipient; this endpoint cannot be used as an arbitrary mail relay.
        const result = await transport.sendMail({
          from: { name: "DWELLUNE", address: storeEmail },
          replyTo: storeEmail,
          to: "hamzaaftab325@gmail.com",
          ...renderOwnerTestEmail(env.NEXT_PUBLIC_SITE_URL),
        });
        if (result.accepted.length !== 1) throw new Error("smtp_test_rejected");
        return { status: "accepted" };
      }
      return { status: "verified" };
    }

    let claim = claimSchema.parse(await rpc(secret, { action: "claim" }));
    if (claim.verify_due) {
      try {
        await transport.verify();
      } catch {
        await rpc(secret, { action: "health", ok: false });
        throw new Error("smtp_verification_failed");
      }
      await rpc(secret, { action: "health", ok: true });
      claim = claimSchema.parse(await rpc(secret, { action: "claim" }));
    }
    const job = claim.job;
    if (!job) return { status: "idle" };
    let outcome: "sent" | "retry" | "failed" | "uncertain";
    let messageId: string | undefined;
    try {
      const result = await transport.sendMail({
        from: { name: "DWELLUNE", address: storeEmail },
        replyTo: storeEmail,
        to: job.payload.to,
        ...renderTransactionalEmail({
          event: job.payload.event,
          subject: job.payload.subject,
          text: job.payload.text,
          orderId: job.order_id,
          siteUrl: env.NEXT_PUBLIC_SITE_URL,
        }),
        messageId: `<dwellune-${job.payload.event}-${emailTemplateVersion}-${job.id}@gmail.com>`,
      });
      outcome = result.accepted.length === 1 ? "sent" : "failed";
      if (outcome === "sent") messageId = result.messageId;
    } catch (error) {
      outcome = smtpFailure(error);
    }
    // An acknowledgement failure retains the sending lease. Expiry requires manual review,
    // rather than blindly resending a message Gmail may already have accepted.
    await rpc(secret, {
      action: "finish",
      id: job.id,
      lease: job.lease,
      result: outcome,
      message_id: messageId,
    });
    return { status: outcome };
  } finally {
    transport.close();
  }
}
