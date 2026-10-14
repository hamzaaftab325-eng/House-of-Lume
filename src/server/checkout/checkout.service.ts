import { createClient } from "@/lib/supabase/server";
import {
  checkoutContextSchema,
  checkoutQuoteSchema,
  deliveryAddressSchema,
  type CheckoutInput,
} from "@/lib/checkout";
import { addressRowSchema, returnPolicySchema } from "@/lib/account";
import { z } from "zod";

async function identity() {
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") throw new Error("authentication_required");
  if (user) {
    const check = await client.rpc("account_session_valid");
    if (user.is_anonymous || check.error || check.data !== true)
      throw new Error("authentication_required");
  }
  return { client, user };
}
export async function checkoutContext() {
  const { client, user } = await identity();
  const policy = await client
    .from("system_settings")
    .select("value")
    .eq("key", "returns.policy")
    .eq("is_public", true)
    .maybeSingle();
  if (policy.error) throw new Error("checkout_unavailable");
  const policyValue: unknown = policy.data?.value;
  const parsedPolicy = returnPolicySchema.safeParse(policyValue);
  let name = "",
    phone = "";
  let addresses: z.infer<typeof addressRowSchema>[] = [];
  if (user) {
    const customer = await client
      .from("customers")
      .select("id,full_name,phone")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (customer.error || !customer.data) throw new Error("authentication_required");
    name = customer.data.full_name ?? "";
    phone = customer.data.phone ?? "";
    const result = await client
      .from("customer_addresses")
      .select(
        "id,label,recipient_name,phone,address_line1,address_line2,city,province,postal_code,is_default",
      )
      .eq("customer_id", customer.data.id)
      .order("is_default", { ascending: false })
      .order("created_at")
      .limit(50);
    if (result.error) throw new Error("checkout_unavailable");
    addresses = z.array(addressRowSchema).parse(result.data);
  }
  return checkoutContextSchema.parse({
    authenticated: Boolean(user),
    email: user?.email ?? "",
    name,
    phone,
    addresses,
    returnPolicy: parsedPolicy.success
      ? `Eligible returns can be requested within ${parsedPolicy.data.window_days} days after delivery. ${parsedPolicy.data.refund_procedure}`
      : null,
  });
}
export async function checkoutQuote(guestHash: string, input: CheckoutInput) {
  const { client, user } = await identity();
  let address = input.address;
  if (input.savedAddressId) {
    if (!user) throw new Error("saved_address_unavailable");
    const customer = await client
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (customer.error || !customer.data) throw new Error("authentication_required");
    const saved = await client
      .from("customer_addresses")
      .select("address_line1,address_line2,city,province,postal_code")
      .eq("id", input.savedAddressId)
      .eq("customer_id", customer.data.id)
      .maybeSingle();
    if (saved.error || !saved.data) throw new Error("saved_address_unavailable");
    address = deliveryAddressSchema.parse({
      line1: saved.data.address_line1,
      line2: saved.data.address_line2 ?? "",
      city: saved.data.city,
      province: saved.data.province,
      postalCode: saved.data.postal_code ?? "",
      country: "PK",
    });
  }
  const { data, error } = await client.rpc("checkout_quote", {
    p_guest_token_hash: guestHash,
    p_address: address,
  });
  if (error) throw new Error(error.message);
  return checkoutQuoteSchema.parse(data);
}
