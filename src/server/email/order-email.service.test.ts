import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  verify: vi.fn(),
  sendMail: vi.fn(),
  close: vi.fn(),
  createTransport: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SITE_URL: "https://dwellune.vercel.app",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key",
  },
}));
vi.mock("nodemailer", () => ({ default: { createTransport: mocks.createTransport } }));
import { runOrderEmails, smtpFailure } from "./order-email.service";
const job = {
  id: "91000000-0000-4000-8000-000000000001",
  order_id: "91000000-0000-4000-8000-000000000002",
  lease: "91000000-0000-4000-8000-000000000003",
  payload: {
    to: ["customer@example.com"],
    subject: "Order received",
    text: "Due on delivery: PKR 1000",
  },
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SMTP_APP_PASSWORD", "abcd efgh ijkl mnop");
  mocks.createTransport.mockReturnValue({
    verify: mocks.verify,
    sendMail: mocks.sendMail,
    close: mocks.close,
  });
  mocks.rpc.mockResolvedValue({ data: { job: null, verify_due: false }, error: null });
});
it("uses TLS and the owner-selected Gmail account, not credentials from input", async () => {
  await runOrderEmails("secret", "verify");
  expect(mocks.createTransport).toHaveBeenCalledWith(
    expect.objectContaining({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: "dwellunestore@gmail.com", pass: "abcdefghijklmnop" },
      disableFileAccess: true,
      disableUrlAccess: true,
    }),
  );
  expect(mocks.rpc).toHaveBeenCalledWith("order_email_worker", {
    p_secret: "secret",
    p_input: { action: "health", ok: true },
  });
  expect(mocks.sendMail).not.toHaveBeenCalled();
});
it("sends only the claimed snapshot and acknowledges Gmail acceptance", async () => {
  mocks.rpc.mockResolvedValueOnce({ data: { job, verify_due: false }, error: null });
  mocks.sendMail.mockResolvedValue({ accepted: job.payload.to, messageId: "stable-id" });
  expect(await runOrderEmails("secret", "dispatch")).toEqual({ status: "sent" });
  expect(mocks.sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: job.payload.to,
      replyTo: "dwellunestore@gmail.com",
      messageId: `<dwellune-order.placed-v2-${job.id}@gmail.com>`,
      html: expect.stringContaining("Due on delivery: PKR 1000"),
      text: expect.stringContaining("Due on delivery: PKR 1000"),
    }),
  );
  expect(mocks.rpc).toHaveBeenLastCalledWith("order_email_worker", {
    p_secret: "secret",
    p_input: {
      action: "finish",
      id: job.id,
      lease: job.lease,
      result: "sent",
      message_id: "stable-id",
    },
  });
});
it("marks ambiguous SMTP acceptance uncertain and never resends in the same run", async () => {
  mocks.rpc.mockResolvedValueOnce({ data: { job, verify_due: false }, error: null });
  mocks.sendMail.mockRejectedValue({ code: "ETIMEDOUT", command: "DATA" });
  expect(await runOrderEmails("secret", "dispatch")).toEqual({ status: "uncertain" });
  expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  expect(mocks.rpc).toHaveBeenLastCalledWith(
    "order_email_worker",
    expect.objectContaining({ p_input: expect.objectContaining({ result: "uncertain" }) }),
  );
});
it("uses the event and snapshotted version of a confirmed-order job", async () => {
  const confirmed = {
    ...job,
    payload: { ...job.payload, event: "order.confirmed", version: "v2" },
  };
  mocks.rpc.mockResolvedValueOnce({ data: { job: confirmed, verify_due: false }, error: null });
  mocks.sendMail.mockResolvedValue({ accepted: job.payload.to, messageId: "confirmation-id" });
  expect(await runOrderEmails("secret", "dispatch")).toEqual({ status: "sent" });
  expect(mocks.sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: job.payload.to,
      messageId: `<dwellune-order.confirmed-v2-${job.id}@gmail.com>`,
      html: expect.stringContaining("Your order is confirmed."),
      text: expect.stringContaining(job.payload.text),
    }),
  );
});
it.each([
  { event: "order.shipped", version: "v2" },
  { event: "order.confirmed", version: "unknown" },
])("does not send unsupported queued events or versions: %j", async (fields) => {
  mocks.rpc.mockResolvedValueOnce({
    data: { job: { ...job, payload: { ...job.payload, ...fields } }, verify_due: false },
    error: null,
  });
  await expect(runOrderEmails("secret", "dispatch")).rejects.toThrow();
  expect(mocks.sendMail).not.toHaveBeenCalled();
  expect(mocks.close).toHaveBeenCalledOnce();
});
it("leaves a sending lease untouched when acknowledgement fails after acceptance", async () => {
  mocks.rpc
    .mockResolvedValueOnce({ data: { job, verify_due: false }, error: null })
    .mockResolvedValueOnce({ data: null, error: { message: "database unavailable" } });
  mocks.sendMail.mockResolvedValue({ accepted: job.payload.to, messageId: "stable-id" });
  await expect(runOrderEmails("secret", "dispatch")).rejects.toThrow(
    "email_worker_database_unavailable",
  );
  expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  expect(mocks.close).toHaveBeenCalledOnce();
});
it("checks an expired health check before claiming an email", async () => {
  mocks.rpc.mockResolvedValueOnce({ data: { job: null, verify_due: true }, error: null });
  expect(await runOrderEmails("secret", "dispatch")).toEqual({ status: "idle" });
  expect(mocks.verify).toHaveBeenCalledOnce();
  expect(mocks.sendMail).not.toHaveBeenCalled();
});
it("closes the gate after SMTP authentication failure", async () => {
  mocks.verify.mockRejectedValue({ code: "EAUTH", response: "private provider body" });
  await expect(runOrderEmails("secret", "verify")).rejects.toThrow("smtp_verification_failed");
  expect(mocks.rpc).toHaveBeenCalledWith("order_email_worker", {
    p_secret: "secret",
    p_input: { action: "health", ok: false },
  });
  expect(mocks.close).toHaveBeenCalledOnce();
});
it("limits diagnostic email to the fixed owner recipient", async () => {
  mocks.sendMail.mockResolvedValue({ accepted: ["hamzaaftab325@gmail.com"] });
  expect(await runOrderEmails("secret", "test")).toEqual({ status: "accepted" });
  expect(mocks.sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "hamzaaftab325@gmail.com",
      subject: "DWELLUNE — branded email test (no order)",
      html: expect.stringContaining("TEST EMAIL"),
      text: expect.stringContaining("No order was created"),
    }),
  );
});
it.each([
  [{ code: "EAUTH" }, "failed"],
  [{ responseCode: 451, command: "DATA" }, "retry"],
  [{ responseCode: 550, command: "DATA" }, "failed"],
  [{ code: "ETIMEDOUT", command: "CONN" }, "retry"],
  [{ code: "EDNS" }, "retry"],
  [{ code: "ECONNECTION", command: "DATA" }, "uncertain"],
  [new Error("unknown"), "uncertain"],
])("classifies SMTP outcome safely: %j", (error, outcome) =>
  expect(smtpFailure(error)).toBe(outcome),
);
