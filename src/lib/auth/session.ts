import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "mammuso_member_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type MemberSession = { userId: string; email: string; accessToken: string; expiresAt: number };

function secret() {
  const value = process.env.AUTH_SESSION_SECRET ?? process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("AUTH_NOT_CONFIGURED");
  return value;
}

function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }

export function encodeMemberSession(session: MemberSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function memberSessionCookie(value: string) {
  return { name: COOKIE_NAME, value, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: MAX_AGE_SECONDS };
}

export function expiredMemberSessionCookie() {
  return { name: COOKIE_NAME, value: "", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 0 };
}

export async function getMemberSession(): Promise<MemberSession | null> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [payload, receivedSignature] = raw.split(".");
  if (!payload || !receivedSignature) return null;
  const expected = sign(payload);
  const safeReceived = Buffer.from(receivedSignature);
  const safeExpected = Buffer.from(expected);
  if (safeReceived.length !== safeExpected.length || !timingSafeEqual(safeReceived, safeExpected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as MemberSession;
    if (!parsed.userId || !parsed.accessToken || parsed.expiresAt * 1000 < Date.now()) return null;
    // A signed cookie alone is not an authorization decision. Confirm the
    // Supabase access token before returning data tied to a member account.
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${parsed.accessToken}` }, cache: "no-store" });
    if (!response.ok) return null;
    const user = await response.json() as { id?: string };
    if (user.id !== parsed.userId) return null;
    return parsed;
  } catch { return null; }
}
