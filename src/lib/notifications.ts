import { z } from "zod";
const audienceSchema = z.enum(["customer", "staff"]);
export type NotificationAudience = z.infer<typeof audienceSchema>;
export const categories = [
  "all",
  "orders",
  "verification",
  "inventory",
  "returns",
  "products",
  "account",
  "operations",
] as const;
export const priorities = ["all", "low", "normal", "high", "critical"] as const;
export const notificationQuerySchema = z
  .object({
    audience: audienceSchema,
    read: z.enum(["all", "unread"]).default("all"),
    category: z.enum(categories).default("all"),
    priority: z.enum(priorities).default("all"),
    before: z.uuid().optional(),
    summary: z.enum(["1"]).optional(),
  })
  .strict();
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
export function safeNotificationLink(value: unknown, audience: NotificationAudience) {
  if (typeof value !== "string") return null;
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
  const order = audience === "staff" ? "/crm/verification/" : "/account/orders/";
  return new RegExp(`^${order}${uuid}$`).test(value) ||
    /^\/products\/[a-z0-9]+(-[a-z0-9]+)*$/.test(value) ||
    (audience === "customer" && value === "/account")
    ? value
    : null;
}
export const feedSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.uuid(),
        title: z.string(),
        body: z.string(),
        priority: z.enum(["low", "normal", "high", "critical"]),
        read_at: z.iso.datetime({ offset: true }).nullable(),
        created_at: z.iso.datetime({ offset: true }),
        category: z.enum(categories).exclude(["all"]),
        href: z.string().nullable(),
      }),
    )
    .max(20),
  next_cursor: z.uuid().nullable(),
  unread: z.number().int().nonnegative(),
  cutoff: z.iso.datetime({ offset: true }),
});
export type NotificationFeed = z.infer<typeof feedSchema>;
export const readSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("read"), audience: audienceSchema, id: z.uuid() }).strict(),
  z
    .object({
      action: z.literal("readAll"),
      audience: audienceSchema,
      cutoff: z.iso.datetime({ offset: true }),
    })
    .strict(),
]);
export type NotificationRead = z.infer<typeof readSchema>;
export const unreadSchema = z.object({ unread: z.number().int().nonnegative() });
