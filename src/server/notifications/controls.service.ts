import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { staffFixtureEnabled } from "@/server/admin/verification.fixture";
import { notificationIdentity } from "./notifications.service";
import {
  preferenceSchema,
  operationsSchema,
  type NotificationPreferences,
} from "@/lib/notification-controls";
export async function notificationPreferences(
  values?: Omit<NotificationPreferences, "essentialUpdates">,
) {
  await notificationIdentity("customer");
  if (staffFixtureEnabled()) {
    const store = await cookies();
    let result = preferenceSchema.parse({
      productUpdates: false,
      emailMarketing: false,
      essentialUpdates: true,
    });
    try {
      result = preferenceSchema.parse(
        JSON.parse(store.get("dwellune-test-notification-preferences")?.value ?? ""),
      );
    } catch {
      /* Fixture defaults. */
    }
    if (values) {
      result = preferenceSchema.parse({ ...values, essentialUpdates: true });
      store.set("dwellune-test-notification-preferences", JSON.stringify(result), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 3600,
      });
    }
    return result;
  }
  const client = await createClient();
  const { data, error } = await client.rpc(
    "notification_preferences",
    values ? { p_values: values } : {},
  );
  if (error) throw new Error(error.message);
  const parsed = preferenceSchema.safeParse(data);
  if (!parsed.success) throw new Error("notification_result_unavailable");
  return parsed.data;
}
export async function notificationOperations(
  status: "all" | "pending" | "sending" | "sent" | "failed" = "all",
) {
  await notificationIdentity("staff");
  if (staffFixtureEnabled())
    return operationsSchema.parse({
      types: [
        {
          key: "order.placed",
          audience: "customer",
          category: "orders",
          required: true,
          state: "active",
          dependency: null,
        },
        {
          key: "product.back_in_stock",
          audience: "customer",
          category: "products",
          required: false,
          state: "deferred",
          dependency: "Product subscription workflow",
        },
      ],
      jobs:
        status === "all" || status === "failed"
          ? [
              {
                id: "a3000000-0000-4000-8000-000000000001",
                order_id: "94000000-0000-4000-8000-000000000001",
                status: "failed",
                attempts: 1,
                error: "smtp_uncertain",
                next_attempt: "2026-10-14T00:00:00Z",
                created_at: "2026-10-14T00:00:00Z",
              },
            ]
          : [],
      health: {
        verified_at: null,
        last_run_at: "2026-10-14T00:00:00Z",
        error: "smtp_verification_failed",
      },
      counts: { pending: 0, sending: 0, failed: 1, sent: 0 },
    });
  const client = await createClient();
  const { data, error } = await client.rpc("notification_operations", { p_status: status });
  if (error) throw new Error(error.message);
  const parsed = operationsSchema.safeParse(data);
  if (!parsed.success) throw new Error("notification_result_unavailable");
  return parsed.data;
}
