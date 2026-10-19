import { z } from "zod";
export const preferenceValuesSchema = z
  .object({ productUpdates: z.boolean(), emailMarketing: z.boolean() })
  .strict();
export const preferenceSchema = preferenceValuesSchema.extend({
  essentialUpdates: z.literal(true),
});
export type NotificationPreferences = z.infer<typeof preferenceSchema>;
export const deliveryFilterSchema = z.enum(["all", "pending", "sending", "sent", "failed"]);
export const operationsSchema = z.object({
  types: z.array(
    z.object({
      key: z.string(),
      audience: z.enum(["customer", "staff"]),
      category: z.string(),
      required: z.boolean(),
      state: z.enum(["active", "deferred"]),
      dependency: z.string().nullable(),
    }),
  ),
  jobs: z
    .array(
      z.object({
        id: z.uuid(),
        order_id: z.uuid(),
        event: z.string().min(1),
        version: z.string().min(1),
        status: z.enum(["pending", "sending", "sent", "failed"]),
        attempts: z.number().int().nonnegative(),
        error: z.string().nullable(),
        next_attempt: z.iso.datetime({ offset: true }),
        created_at: z.iso.datetime({ offset: true }),
      }),
    )
    .max(20),
  health: z.object({
    verified_at: z.iso.datetime({ offset: true }).nullable(),
    last_run_at: z.iso.datetime({ offset: true }).nullable(),
    error: z.string().nullable(),
  }),
  counts: z.object({
    pending: z.number().int().nonnegative(),
    sending: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    sent: z.number().int().nonnegative(),
  }),
});
