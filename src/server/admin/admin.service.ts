import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { staffFixtureEnabled, staffFixtureIdentity } from "./verification.fixture";
export const adminIdentity = cache(async () => {
  if (staffFixtureEnabled()) return staffFixtureIdentity();
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user || user.is_anonymous) throw new Error("authentication_required");
  const session = await client.rpc("account_session_valid");
  if (session.error || session.data !== true) throw new Error("authentication_required");
  const staff = await client
    .from("staff_profiles")
    .select("role_slug,is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .eq("role_slug", "super_admin")
    .maybeSingle();
  if (staff.error) throw new Error("staff_check_failed");
  if (!staff.data) throw new Error("staff_access_required");
  const customer = await client
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();
  if (customer.error || !customer.data) throw new Error("admin_account_unavailable");
  return { email: user.email ?? "", customerId: customer.data.id };
});
