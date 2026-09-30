export type SajuGender = "female" | "male";

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
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return { value: null, needsMeridiem: false };

  const hour = Number(match[1]);
  const minute = match[2] === undefined ? 0 : Number(match[2]);
  if (hour < 0 || hour > 12 || minute < 0 || minute > 59) return { value: null, needsMeridiem: false };
  if (!meridiem) return { value: null, needsMeridiem: true };

  const normalizedHour = meridiem === "am"
    ? (hour === 12 ? 0 : hour)
    : (hour === 0 || hour === 12 ? 12 : hour + 12);
  return { value: `${String(normalizedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, needsMeridiem: false };
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
