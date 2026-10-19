import { createClient } from "@/lib/supabase/server";
import { adminIdentity } from "./admin.service";
import { policySchema, type PolicyAction } from "@/lib/verification";
import { adminFixtureEnabled, fixturePolicy } from "./verification.fixture";
export async function verificationPolicy(action?: PolicyAction) {
  await adminIdentity();
  if (adminFixtureEnabled()) return fixturePolicy(action);
  const client = await createClient();
  const { data, error } = await client.rpc(
    "staff_verification_policy",
    action
      ? {
          p_request_id: action.requestId,
          p_input: {
            expectedRevision: action.expectedRevision,
            note: action.note,
            values: action.values,
          },
        }
      : {},
  );
  if (error) throw new Error(error.message);
  const result = policySchema.safeParse(data);
  if (!result.success) throw new Error("verification_policy_unavailable");
  return result.data;
}
