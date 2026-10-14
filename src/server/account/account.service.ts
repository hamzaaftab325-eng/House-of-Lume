import { createClient } from "@/lib/supabase/server";
import {
  addressRowSchema,
  customerSchema,
  notificationSchema,
  orderItemSchema,
  orderHistorySchema,
  orderSchema,
  returnPolicySchema,
  returnSchema,
  type AccountAction,
  type NotificationFilter,
} from "@/lib/account";
import { z } from "zod";
import { cache } from "react";

export const accountIdentity = cache(async () => {
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user || user.is_anonymous || !user.email || !user.email_confirmed_at)
    throw new Error("authentication_required");
  const session = await client.rpc("account_session_valid");
  if (session.error || session.data !== true) throw new Error("authentication_required");
  const result = await client
    .from("customers")
    .select("id,full_name,phone,whatsapp_number,status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (result.error || !result.data) throw new Error("account_unavailable");
  const customer = customerSchema.parse(result.data);
  return { client, customer, email: user.email ?? "" };
});

export async function accountSnapshot(page = 1, filter: NotificationFilter = "all") {
  const identity = await accountIdentity();
  const { client, customer } = identity;
  let notificationQuery = client
    .from("notifications")
    .select("id,title,body,priority,read_at,created_at,entity_type,entity_id")
    .order("created_at", { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);
  if (filter === "unread") notificationQuery = notificationQuery.is("read_at", null);
  if (filter === "orders") notificationQuery = notificationQuery.eq("entity_type", "order");
  if (filter === "returns") notificationQuery = notificationQuery.eq("entity_type", "return");
  if (filter === "account")
    notificationQuery = notificationQuery.in("entity_type", ["account", "customer", "profile"]);
  const [addresses, orders, notifications, returns, preferences, policy, unread] =
    await Promise.all([
      client
        .from("customer_addresses")
        .select(
          "id,label,recipient_name,phone,address_line1,address_line2,city,province,postal_code,is_default",
        )
        .eq("customer_id", customer.id)
        .order("is_default", { ascending: false })
        .order("created_at")
        .limit(50),
      client
        .from("orders")
        .select(
          "id,order_number,status,total_pkr,subtotal_pkr,discount_pkr,shipping_pkr,tax_pkr,placed_at,delivered_at",
          { count: "exact" },
        )
        .eq("customer_id", customer.id)
        .order("placed_at", { ascending: false })
        .range((page - 1) * 20, page * 20 - 1),
      notificationQuery,
      client
        .from("returns")
        .select("id,order_id,return_number,status,reason_code,requested_at")
        .eq("customer_id", customer.id)
        .order("requested_at", { ascending: false })
        .range((page - 1) * 20, page * 20 - 1),
      client
        .from("notification_preferences")
        .select("email_marketing")
        .eq("customer_id", customer.id)
        .maybeSingle(),
      client
        .from("system_settings")
        .select("value")
        .eq("key", "returns.policy")
        .eq("is_public", true)
        .maybeSingle(),
      client.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    ]);
  if ([addresses, orders, notifications, returns, preferences, policy, unread].some((r) => r.error))
    throw new Error("account_load_failed");
  const parsedPolicy = returnPolicySchema.safeParse(policy.data?.value);
  return {
    serverTime: Date.now(),
    customer,
    email: identity.email,
    addresses: z.array(addressRowSchema).parse(addresses.data),
    orders: z.array(orderSchema).parse(orders.data),
    orderCount: orders.count ?? 0,
    notifications: z.array(notificationSchema).parse(notifications.data),
    unread: unread.count ?? 0,
    returns: z.array(returnSchema).parse(returns.data),
    emailMarketing: Boolean(preferences.data?.email_marketing),
    returnPolicy: parsedPolicy.success ? parsedPolicy.data : null,
  };
}

export async function accountOrder(id: string) {
  const { client, customer } = await accountIdentity();
  const result = await client
    .from("orders")
    .select(
      "id,order_number,status,total_pkr,subtotal_pkr,discount_pkr,shipping_pkr,tax_pkr,placed_at,delivered_at",
    )
    .eq("customer_id", customer.id)
    .eq("id", id)
    .maybeSingle();
  if (result.error) throw new Error("account_load_failed");
  if (!result.data) return null;
  const [items, address, history, previousReturns] = await Promise.all([
    client
      .from("order_items")
      .select("id,product_id,product_name,variant_name,quantity,line_total_pkr")
      .eq("order_id", id)
      .order("created_at"),
    client
      .from("order_addresses")
      .select("recipient_name,address_line1,address_line2,city,province,postal_code,phone")
      .eq("order_id", id)
      .eq("address_type", "shipping")
      .maybeSingle(),
    client
      .from("order_status_history")
      .select("id,from_status,to_status,created_at")
      .eq("order_id", id)
      .order("created_at")
      .limit(100),
    client
      .from("returns")
      .select("status,return_items(order_item_id,quantity)")
      .eq("order_id", id)
      .not("status", "in", "(rejected,cancelled)"),
  ]);
  if (items.error || address.error || history.error || previousReturns.error)
    throw new Error("account_load_failed");
  const used = new Map<string, number>();
  const returned = z
    .array(
      z.object({
        return_items: z.array(
          z.object({ order_item_id: z.uuid(), quantity: z.number().int().positive() }),
        ),
      }),
    )
    .parse(previousReturns.data);
  for (const record of returned)
    for (const item of record.return_items)
      used.set(item.order_item_id, (used.get(item.order_item_id) ?? 0) + item.quantity);
  return {
    order: orderSchema.parse(result.data),
    items: z.array(orderItemSchema).parse(items.data),
    returnableItems: z
      .array(orderItemSchema)
      .parse(items.data)
      .map((item) => ({
        ...item,
        quantity: Math.max(0, item.quantity - (used.get(item.id) ?? 0)),
      })),
    history: z.array(orderHistorySchema).parse(history.data),
    address: address.data
      ? z
          .object({
            recipient_name: z.string(),
            address_line1: z.string(),
            address_line2: z.string().nullable(),
            city: z.string(),
            province: z.string(),
            postal_code: z.string().nullable(),
            phone: z.string(),
          })
          .parse(address.data)
      : null,
  };
}

export async function accountMutate(action: AccountAction) {
  const { client, customer } = await accountIdentity();
  let result;
  switch (action.action) {
    case "profile":
      result = await client.rpc("account_save_profile", {
        p_name: action.values.name,
        p_phone: action.values.phone,
        p_whatsapp: action.values.whatsapp,
      });
      break;
    case "address":
      result = await client.rpc("account_save_address", { p_values: action.values });
      break;
    case "deleteAddress":
      result = await client.rpc("account_delete_address", { p_id: action.id });
      break;
    case "preferences":
      result = await client.rpc("account_save_preferences", {
        p_email_marketing: action.values.emailMarketing,
      });
      break;
    case "readNotification": {
      const notification = await client
        .from("notifications")
        .select("id,read_at")
        .eq("id", action.id)
        .maybeSingle();
      if (notification.error || !notification.data) throw new Error("account_write_failed");
      if (notification.data.read_at) return { saved: true, customerId: customer.id };
      result = await client
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", action.id)
        .is("read_at", null);
      break;
    }
    case "readAllNotifications":
      result = await client
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      break;
    case "return":
      result = await client.rpc("account_request_return", {
        p_order_id: action.orderId,
        p_request_id: action.requestId,
        p_reason: action.reason,
        p_detail: action.detail,
        p_items: action.items,
      });
      break;
  }
  if (result.error)
    throw new Error(
      result.error.message === "return_policy_unavailable"
        ? "return_policy_unavailable"
        : "account_write_failed",
    );
  return { saved: true, customerId: customer.id };
}
