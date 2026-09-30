export type SajuGender = "female" | "male" | "other";

export type SajuProfileInput = {
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  gender: SajuGender;
};

export type TodayTarotProfileContext = SajuProfileInput & {
  source: "guest" | "member";
};

export const TODAY_TAROT_PROFILE_KEY = "mammuso:today-tarot:profile";

export function formatBirthDate(value: string) {
  const parsed = parseBirthDate(value);
  if (!parsed) return value;
  const [year, month, day] = parsed.split("-");
  return `${year}. ${month}. ${day}`;
}

export function parseBirthDate(value: string) {
  const digits = value.trim().replace(/[^0-9]/g, "");
  if (digits.length !== 8) return null;
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseBirthTime(value: string, meridiem?: "am" | "pm") {
  const normalized = value.trim().toLowerCase().replace(/\s/g, "");
  if (!normalized) return { value: null, needsMeridiem: false };
  const hasAm = /오전|am/.test(normalized);
  const hasPm = /오후|pm/.test(normalized);
  const digits = normalized.replace(/오전|오후|am|pm|시|분|:/g, "").replace(/[^0-9]/g, "");
  let hour: number;
  let minute = 0;
  if (digits.length <= 2) hour = Number(digits);
  else if (digits.length === 3 || digits.length === 4) {
    hour = Number(digits.slice(0, -2));
    minute = Number(digits.slice(-2));
  } else return { value: null, needsMeridiem: false };
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute > 59) return { value: null, needsMeridiem: false };
  const resolvedMeridiem = hasAm ? "am" : hasPm ? "pm" : meridiem;
  if (hour >= 0 && hour <= 12 && !resolvedMeridiem && hour !== 0) return { value: null, needsMeridiem: true };
  if (resolvedMeridiem) {
    if (hour < 1 || hour > 12) return { value: null, needsMeridiem: false };
    if (resolvedMeridiem === "am") hour = hour === 12 ? 0 : hour;
    if (resolvedMeridiem === "pm") hour = hour === 12 ? 12 : hour + 12;
  }
  if (hour > 23) return { value: null, needsMeridiem: false };
  return { value: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, needsMeridiem: false };
}

export function persistTodayTarotProfile(profile: TodayTarotProfileContext) {
  window.sessionStorage.setItem(TODAY_TAROT_PROFILE_KEY, JSON.stringify(profile));
}

export function readTodayTarotProfile() {
  const saved = window.sessionStorage.getItem(TODAY_TAROT_PROFILE_KEY);
  if (!saved) return null;
  try {
    const profile = JSON.parse(saved) as TodayTarotProfileContext;
    return parseBirthDate(profile.birthDate) && (profile.birthTimeUnknown || /^([01]\d|2[0-3]):[0-5]\d$/.test(profile.birthTime ?? "")) ? profile : null;
  } catch {
    return null;
  }
}
