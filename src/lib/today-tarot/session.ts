import { FULL_TAROT_DECK_SIZE, tarotDeckCapacity } from "./deck";
import type { TodayTarotSession } from "./flow";
import type { TodayTarotProfileContext } from "./profile";

export const TODAY_TAROT_SESSION_KEY = "mammuso:today-tarot:session";

type PreparedTodayTarotSession = TodayTarotSession & {
  id: string;
  preparedAt: string;
  /** No profile source exists in the current app, so this remains explicit. */
  sajuDailyFlowStatus: "not-configured";
};

const suitIds = (suit: "wands" | "cups" | "swords" | "pentacles") =>
  Array.from({ length: tarotDeckCapacity[suit] }, (_, index) => `${suit}-${String(index + 1).padStart(2, "0")}`);

/** Generates all 78 card positions without using any saju or AI input. */
export function createTodayTarotDeckOrder(random: () => number = Math.random) {
  const deck = [
    ...Array.from({ length: tarotDeckCapacity.major }, (_, index) => `major-${String(index).padStart(2, "0")}`),
    ...suitIds("wands"),
    ...suitIds("cups"),
    ...suitIds("swords"),
    ...suitIds("pentacles"),
  ];

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

export function todayInSeoul(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value: part }) => [type, part]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function prepareTodayTarotSession(profile: TodayTarotProfileContext, now = new Date()): PreparedTodayTarotSession {
  const shuffledCardIds = createTodayTarotDeckOrder();
  if (shuffledCardIds.length !== FULL_TAROT_DECK_SIZE) throw new Error("TODAY_TAROT_DECK_SIZE_MISMATCH");

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    dateKey: todayInSeoul(now),
    step: "selection",
    shuffledCardIds,
    preparedAt: now.toISOString(),
    profileSource: profile.source,
    sajuDailyFlowStatus: "not-configured",
  };
}

export function persistTodayTarotSession(session: PreparedTodayTarotSession) {
  window.sessionStorage.setItem(TODAY_TAROT_SESSION_KEY, JSON.stringify(session));
}
