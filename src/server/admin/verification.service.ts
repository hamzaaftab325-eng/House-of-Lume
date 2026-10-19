import { createClient } from "@/lib/supabase/server";
import { adminIdentity } from "./admin.service";
import {
  adminFixtureEnabled,
  fixtureQueue,
  fixtureDetail,
  fixtureAction,
} from "./verification.fixture";
import {
  verificationQueueSchema,
  verificationDetailSchema,
  verificationResultSchema,
  type QueueFilter,
  type VerificationAction,
} from "@/lib/verification";

export async function verificationQueue(filter: QueueFilter, before: string | null) {
  await adminIdentity();
  if (adminFixtureEnabled()) return fixtureQueue(filter);
  const client = await createClient();
  const { data, error } = await client.rpc("staff_verification_queue", {
    p_filter: filter,
    p_before: before,
  });
  if (error) throw new Error(error.message);
  return verificationQueueSchema.parse(data);
}
export async function verificationDetail(id: string) {
  await adminIdentity();
  if (adminFixtureEnabled()) return fixtureDetail(id);
  const client = await createClient();
  const { data, error } = await client.rpc("staff_verification_detail", { p_order_id: id });
  if (error) throw new Error(error.message);
  return verificationDetailSchema.parse(data);
}
export async function verificationAction(action: VerificationAction) {
  await adminIdentity();
  if (adminFixtureEnabled()) return fixtureAction(action);
  const client = await createClient();
  const { data, error } = await client.rpc("staff_verification_action", {
    p_order_id: action.orderId,
    p_request_id: action.requestId,
    p_input: action.input,
  });
  if (error) throw new Error(error.message);
  const result = verificationResultSchema.safeParse(data);
  if (!result.success) throw new Error("verification_result_unavailable");
  return result.data;
}
