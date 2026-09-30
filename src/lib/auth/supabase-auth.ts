import "server-only";

type AuthResponse = { access_token?: string; expires_in?: number; user?: { id: string; email?: string | null }; error_description?: string; msg?: string };

function configuration() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("AUTH_NOT_CONFIGURED");
  return { url, key };
}

async function authRequest(path: string, body: Record<string, unknown>) {
  const { url, key } = configuration();
  const response = await fetch(`${url}/auth/v1/${path}`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const payload = await response.json() as AuthResponse;
  if (!response.ok) throw new Error(payload.error_description ?? payload.msg ?? "AUTH_REQUEST_FAILED");
  if (!payload.access_token || !payload.user?.id) throw new Error("EMAIL_CONFIRMATION_REQUIRED");
  return { accessToken: payload.access_token, expiresAt: Math.floor(Date.now() / 1000) + (payload.expires_in ?? 3600), userId: payload.user.id, email: payload.user.email ?? "" };
}

export function signInWithPassword(email: string, password: string) { return authRequest("token?grant_type=password", { email, password }); }
export function signUpWithPassword(email: string, password: string) { return authRequest("signup", { email, password }); }
