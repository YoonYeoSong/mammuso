import "server-only";
import type { SajuProfileInput } from "./profile";

type MemberReading = { sessionId: string; dateKey: string; mainCardId: string; orientation: "upright" | "reversed"; clarifierCardId?: string };

function configuration() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("DB_NOT_CONFIGURED");
  return { url, key };
}

async function request(table: string, path: string, init: RequestInit = {}) {
  const { url, key } = configuration();
  const response = await fetch(`${url}/rest/v1/${table}${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation", ...init.headers },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`DATABASE_ERROR:${response.status}`);
  return response.status === 204 ? [] : response.json() as Promise<Record<string, unknown>[]>;
}

function rowToProfile(row: Record<string, unknown>): SajuProfileInput {
  return { birthDate: String(row.birth_date), birthTime: row.birth_time ? String(row.birth_time).slice(0, 5) : null, birthTimeUnknown: Boolean(row.birth_time_unknown), gender: row.gender as SajuProfileInput["gender"] };
}

export async function getMemberSajuProfile(userId: string) {
  const rows = await request("saju_profiles", `?user_id=eq.${encodeURIComponent(userId)}&select=birth_date,birth_time,birth_time_unknown,gender&limit=1`);
  return rows[0] ? rowToProfile(rows[0]) : null;
}

export async function saveMemberSajuProfile(userId: string, profile: SajuProfileInput) {
  const rows = await request("saju_profiles?on_conflict=user_id", "", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ user_id: userId, birth_date: profile.birthDate, birth_time: profile.birthTime, birth_time_unknown: profile.birthTimeUnknown, gender: profile.gender }),
  });
  return rowToProfile(rows[0]);
}

export async function saveMemberReading(userId: string, reading: MemberReading) {
  await request("tarot_readings?on_conflict=user_id,session_id", "", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ user_id: userId, session_id: reading.sessionId, reading_date: reading.dateKey, main_card_id: reading.mainCardId, main_orientation: reading.orientation, clarifier_card_id: reading.clarifierCardId ?? null }) });
}
