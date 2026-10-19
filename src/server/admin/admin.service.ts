import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { z } from "zod";
import { adminFixtureEnabled, adminFixtureIdentity } from "./verification.fixture";

const ownerContextSchema = z.object({ userId: z.uuid(), email: z.email() });

export const adminIdentity = cache(async () => {
  if (adminFixtureEnabled()) return adminFixtureIdentity();
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user || user.is_anonymous) throw new Error("authentication_required");
  const { data, error: contextError } = await client.rpc("owner_context");
  if (contextError) {
    if (contextError.message === "authentication_required")
      throw new Error("authentication_required");
    if (["staff_access_required", "admin_access_required"].includes(contextError.message))
      throw new Error("admin_access_required");
    throw new Error("admin_context_unavailable");
  }
  const context = ownerContextSchema.safeParse(data);
  if (!context.success || context.data.userId !== user.id)
    throw new Error("admin_context_unavailable");
  return context.data;
});
