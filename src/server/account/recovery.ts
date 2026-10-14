import { createHmac, timingSafeEqual } from "node:crypto";

type RecoveryGrant = { userId: string; sessionId: string; expires: number };
function secret() {
  const value = process.env.AUTH_RECOVERY_SECRET;
  if (!value || value.length < 32) throw new Error("recovery_not_ready");
  return value;
}
export function signRecoveryGrant(userId: string, sessionId: string) {
  const grant: RecoveryGrant = { userId, sessionId, expires: Date.now() + 600000 };
  const payload = Buffer.from(JSON.stringify(grant)).toString("base64url");
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("hex")}`;
}
export function verifyRecoveryGrant(value: string | undefined, userId: string, sessionId: string) {
  try {
    if (!value || value.length > 2048) return false;
    const [payload, signature, extra] = value.split(".");
    if (extra || !/^[a-f0-9]{64}$/.test(signature ?? "")) return false;
    const expected = createHmac("sha256", secret()).update(payload).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) return false;
    const grant: unknown = JSON.parse(Buffer.from(payload, "base64url").toString());
    return (
      typeof grant === "object" &&
      grant !== null &&
      "userId" in grant &&
      "sessionId" in grant &&
      "expires" in grant &&
      grant.userId === userId &&
      grant.sessionId === sessionId &&
      typeof grant.expires === "number" &&
      grant.expires > Date.now()
    );
  } catch {
    return false;
  }
}
