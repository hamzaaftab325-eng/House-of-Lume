import { z } from "zod";

export const emailTemplateVersion = "v1";
export const emailEventSchema = z.enum([
  "order.placed",
  "order.verification_required",
  "order.confirmed",
  "order.cancelled",
  "return.requested",
]);
export type EmailEvent = z.infer<typeof emailEventSchema>;

const content: Record<EmailEvent, { title: string; introduction: string }> = {
  "order.placed": {
    title: "Your order is received.",
    introduction: "Thank you for choosing DWELLUNE. Your Cash on Delivery order details are below.",
  },
  "order.verification_required": {
    title: "Your order awaits verification.",
    introduction:
      "Our team will review your COD order and may contact you to confirm the delivery details. This is an order check; your account is already active.",
  },
  "order.confirmed": {
    title: "Your order is confirmed.",
    introduction:
      "Your COD order has been confirmed. We will share dispatch information when it is available. No online payment is required.",
  },
  "order.cancelled": {
    title: "Your order is cancelled.",
    introduction:
      "Your order has been cancelled. No COD payment is due for this cancelled order. Contact us if you need help.",
  },
  "return.requested": {
    title: "Your return request is received.",
    introduction:
      "Our team will review your request and contact you with the next steps. This receipt does not mean your return or refund has been approved. Please wait for return instructions before sending any items.",
  },
};

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
  );
}

// Email-specific tokens mirror BRAND.md. Embedded CSS respects the repository's
// no-inline-style rule; table attributes retain a readable stripped-CSS fallback.
const css = `
body { margin:0; background:#F7F0E5; color:#281103; font-family:Arial,Helvetica,sans-serif; }
table { border-collapse:collapse; } .canvas { width:100%; background:#F7F0E5; }
.sheet { width:100%; max-width:600px; background:#FFF8EE; }
.gutter { padding:32px; } .brand { border-bottom:1px solid #EADCC8; background:#FFF8EE; }
.logo { display:block; width:200px; max-width:100%; height:auto; }
.eyebrow { font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#502A0D; }
h1 { font-family:Georgia,serif; font-size:36px; line-height:1.15; font-weight:400; margin:16px 0; }
p { font-size:16px; line-height:1.6; margin:16px 0; overflow-wrap:anywhere; word-break:break-word; }
.details { padding:20px 0; border-top:1px solid #EADCC8; border-bottom:1px solid #EADCC8; }
.details p { margin:8px 0; } a { color:#502A0D; } .cta { display:inline-block; background:#281103; color:#FFF8EE; padding:16px 24px; text-decoration:none; font-weight:bold; }
.footer { color:#502A0D; font-size:14px; } .test { border:1px solid #502A0D; padding:12px; font-weight:bold; }
@media screen and (max-width:480px) { .gutter { padding:24px 20px; } h1 { font-size:30px; } }
@media (prefers-color-scheme:dark) { body,.canvas { background:#281103; color:#FFF8EE; } .sheet { background:#502A0D; } .eyebrow,.footer,a { color:#FFF8EE; } .cta { background:#FFF8EE; color:#281103; } .brand,.details,.test { border-color:#EADCC8; } }
`;

const inputSchema = z.object({
  event: emailEventSchema,
  subject: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[^\r\n]+$/),
  text: z.string().min(1).max(100_000),
  orderId: z.uuid().optional(),
  siteUrl: z.url(),
  test: z.boolean().default(false),
});

export function renderTransactionalEmail(input: z.input<typeof inputSchema>) {
  const values = inputSchema.parse(input);
  const origin = new URL(values.siteUrl);
  if (
    origin.protocol !== "https:" &&
    !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname))
  )
    throw new Error("email_origin_invalid");
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/")
    throw new Error("email_origin_invalid");
  const copy = content[values.event];
  // Account authorization still owns this route. Never include guest tokens or
  // customer-provided URLs in mail; guests can reply with their order number.
  const link = `${origin.origin}${values.orderId ? `/account/orders/${values.orderId}` : "/account"}`;
  const label = values.orderId ? "View order in your account" : "Visit your account";
  const testNotice =
    "TEST EMAIL — sample content only. No order was created and no payment is due.";
  const paragraphs = values.text
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\r?\n/g, "<br>")}</p>`)
    .join("");
  const text = `${values.test ? `${testNotice}\n\n` : ""}${copy.title}\n${copy.introduction}\n\n${values.text}\n\n${label}: ${link}\nSign in to the account used for your order. Guest customers can reply with their order number.\n\nNeed help? Reply to dwellunestore@gmail.com.\nDWELLUNE · Home Décor`;
  const html = `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>${escapeHtml(values.subject)}</title><style>${css}</style></head><body><table class="canvas" role="presentation" lang="en" dir="ltr" width="100%" cellpadding="0" cellspacing="0" bgcolor="#F7F0E5"><tr><td align="center"><table class="sheet" role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#FFF8EE"><tr><td class="gutter brand"><img class="logo" src="${escapeHtml(origin.origin)}/email-logo.png" width="200" height="84" alt="DWELLUNE Home Décor"></td></tr><tr><td class="gutter">${values.test ? `<p class="test">${testNotice}</p>` : ""}<p class="eyebrow">Home, thoughtfully chosen</p><h1>${copy.title}</h1><p>${copy.introduction}</p><div class="details">${paragraphs}</div><p><a class="cta" href="${escapeHtml(link)}">${label}</a></p><p class="footer">Sign in to the account used for your order. Guest customers can reply with their order number.</p><p class="footer">Need help? Reply to <a href="mailto:dwellunestore@gmail.com">dwellunestore@gmail.com</a>.</p><p class="footer">DWELLUNE · Home Décor<br>Essential account and order communication.</p></td></tr></table></td></tr></table></body></html>`;
  return { html, text, subject: values.subject, version: emailTemplateVersion };
}

export function renderOwnerTestEmail(siteUrl: string) {
  return renderTransactionalEmail({
    event: "order.placed",
    siteUrl,
    subject: "DWELLUNE — branded email test (no order)",
    test: true,
    text: "Sample order receipt — not a real order\n\nCeramic vase / Sand × 1 — PKR 2,400\nLinen cushion cover / Natural × 1 — PKR 1,800\n\nSubtotal: PKR 4,200\nDiscount: PKR 0\nDelivery: PKR 250\nDue on delivery: PKR 4,450 (sample only)\n\nThe production sender is dwellunestore@gmail.com. Please confirm that this email arrived and the layout looks correct. No payment or action is required.",
  });
}
