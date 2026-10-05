import { FULL_TAROT_DECK_SIZE, shuffleTodayTarotDeck } from "./deck";
import type { TodayTarotSession } from "./flow";

export const TODAY_TAROT_SESSION_KEY = "mammuso:today-tarot:session";

type PreparedTodayTarotSession = TodayTarotSession & {
  id: string;
  preparedAt: string;
};

/** Generates all 78 card positions without using any saju or AI input. */
export function createTodayTarotDeckOrder(random: () => number = Math.random) {
  return shuffleTodayTarotDeck(undefined, random).map((card) => card.id);
}

export function todayInSeoul(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value: part }) => [type, part]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function prepareTodayTarotSession(now = new Date()): PreparedTodayTarotSession {
  const deckOrder = createTodayTarotDeckOrder();
  if (deckOrder.length !== FULL_TAROT_DECK_SIZE) throw new Error("TODAY_TAROT_DECK_SIZE_MISMATCH");

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    dateKey: todayInSeoul(now),
    step: "selection",
    deckOrder,
    clarifierCardId: null,
    clarifierOrientation: null,
    preparedAt: now.toISOString(),
  };
}

export function persistTodayTarotSession(session: PreparedTodayTarotSession) {
  window.sessionStorage.setItem(TODAY_TAROT_SESSION_KEY, JSON.stringify(session));
}
