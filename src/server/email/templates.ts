import { z } from "zod";

export const emailTemplateVersion = "v2";
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

function renderDetailBlock(paragraph: string): string {
  const lines = paragraph.trim().split(/\r?\n/);
  const totals = lines.map((line) =>
    /^(Subtotal|Discount|Delivery|Due on delivery): (PKR [\d,.]+(?: \(sample only\))?)$/.exec(line),
  );
  if (totals.length > 1 && totals.every((match) => match !== null)) {
    return `<div class="summary"><h2>Payment summary</h2><table><tbody>${totals
      .map((match) => {
        const [, label, amount] = match!;
        return `<tr${label === "Due on delivery" ? ' class="due"' : ""}><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(amount)}</td></tr>`;
      })
      .join("")}</tbody></table></div>`;
  }
  return `<p>${escapeHtml(paragraph).replace(/\r?\n/g, "<br>")}</p>`;
}

// Email-specific tokens mirror BRAND.md. Embedded CSS respects the repository's
// no-inline-style rule; table attributes retain a readable stripped-CSS fallback.
const css = `
body { margin:0; background:#F7F0E5; font-family:Arial,Helvetica,sans-serif; }
table { border-collapse:collapse; } .canvas { width:100%; background:#F7F0E5; }
.sheet { width:100%; max-width:600px; background:#FFF8EE; }
.sheet td,.sheet p,.sheet h1,.sheet h2,.sheet th { color:#281103 !important; }
.gutter { padding:32px; } .brand { border-bottom:1px solid #EADCC8; background:#FFF8EE !important; }
.logo { display:block; width:220px; max-width:100%; height:auto; margin:0 auto; }
.sheet .eyebrow { font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#502A0D !important; }
h1 { font-family:Georgia,serif; font-size:36px; line-height:1.2; font-weight:400; margin:16px 0; }
h2 { font-size:16px; line-height:1.5; margin:0 0 12px; }
p { font-size:16px; line-height:1.65; margin:16px 0; overflow-wrap:anywhere; word-break:break-word; }
.details { padding:16px 0; border-top:1px solid #EADCC8; border-bottom:1px solid #EADCC8; }
.details p { margin:12px 0; } .summary { margin:24px 0; } .summary table { width:100%; }
.summary th,.summary td { padding:10px 0; font-size:15px; line-height:1.5; } .summary th { text-align:left; font-weight:400; width:52%; }
.summary td { text-align:right; } .summary .due th,.summary .due td { border-top:1px solid #EADCC8; padding-top:16px; font-size:17px; font-weight:bold; }
.sheet a,.sheet a span { color:#502A0D !important; text-decoration:underline; }
.sheet a.cta { display:inline-block; background:#281103 !important; padding:16px 24px; text-decoration:none !important; border:1px solid #281103; font-size:16px; line-height:1.5; font-weight:bold; }
.sheet a.cta,.sheet a.cta span { color:#FFF8EE !important; text-decoration:none !important; }
.sheet .footer { color:#502A0D !important; font-size:14px; line-height:1.65; }
.test { border:1px solid #EADCC8; padding:12px 16px; background:#F7F0E5; font-size:14px; }
@media screen and (max-width:480px) { .gutter { padding:24px 20px; } h1 { font-size:30px; } .sheet a.cta { display:block; text-align:center; padding:16px 12px; } }
@media (prefers-color-scheme:dark) {
 body,.canvas,.sheet { background:#281103 !important; }
 .sheet td,.sheet p,.sheet h1,.sheet h2,.sheet th,.sheet .eyebrow,.sheet .footer,.sheet a,.sheet a span { color:#FFF8EE !important; }
 .sheet a.cta { background:#FFF8EE !important; border-color:#FFF8EE; }
 .sheet a.cta,.sheet a.cta span { color:#281103 !important; }
 .test { background:#502A0D !important; } .brand,.details,.test,.summary .due th,.summary .due td { border-color:#75634E; }
}
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
  const copy = values.test
    ? {
        title: "Your email preview.",
        introduction:
          "A preview of your DWELLUNE order emails. The details below are samples; no order was created.",
      }
    : content[values.event];
  // Account authorization still owns this route. Never include guest tokens or
  // customer-provided URLs in mail; guests can reply with their order number.
  const link = `${origin.origin}${values.orderId ? `/account/orders/${values.orderId}` : "/account"}`;
  const label = values.orderId ? "View order in your account" : "Visit your account";
  const testNotice =
    "TEST EMAIL — sample content only. No order was created and no payment is due.";
  const paragraphs = values.text
    .split(/\n\s*\n/)
    .map(renderDetailBlock)
    .join("");
  const text = `${values.test ? `${testNotice}\n\n` : ""}${copy.title}\n${copy.introduction}\n\n${values.text}\n\n${label}: ${link}\nSign in to the account used for your order. Guest customers can reply with their order number.\n\nNeed help? Reply to dwellunestore@gmail.com.\nDWELLUNE · Home Décor`;
  const html = `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>${escapeHtml(values.subject)}</title><style>${css}</style></head><body><table class="canvas" role="presentation" lang="en" dir="ltr" width="100%" cellpadding="0" cellspacing="0" bgcolor="#F7F0E5"><tr><td align="center"><table class="sheet" role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#FFF8EE"><tr><td class="gutter brand"><img class="logo" src="${escapeHtml(origin.origin)}/email-logo.png?v=2" width="220" height="93" alt="DWELLUNE Home Décor"></td></tr><tr><td class="gutter">${values.test ? `<p class="test">${testNotice}</p>` : ""}<p class="eyebrow">Home, thoughtfully chosen</p><h1>${copy.title}</h1><p>${copy.introduction}</p><div class="details">${paragraphs}</div><p><a class="cta" href="${escapeHtml(link)}"><span>${label}</span></a></p><p class="footer">Sign in to the account used for your order. Guest customers can reply with their order number.</p><p class="footer">Need help? Reply to <a href="mailto:dwellunestore@gmail.com">dwellunestore@gmail.com</a>.</p><p class="footer">DWELLUNE · Home Décor<br>Essential account and order communication.</p></td></tr></table></td></tr></table></body></html>`;
  return { html, text, subject: values.subject, version: emailTemplateVersion };
}

export function renderOwnerTestEmail(siteUrl: string) {
  return renderTransactionalEmail({
    event: "order.placed",
    siteUrl,
    subject: "DWELLUNE — branded email test (no order)",
    test: true,
    text: "Sample order receipt — not a real order\n\nCeramic vase / Sand × 1 — PKR 2,400\nLinen cushion cover / Natural × 1 — PKR 1,800\n\nSubtotal: PKR 4,200\nDiscount: PKR 0\nDelivery: PKR 250\nDue on delivery: PKR 4,450 (sample only)\n\nNo online payment is required. This is sample content only.",
  });
}
