import { allTarotAssets, getTarotAsset, type TarotDeckAsset } from "@/lib/tarot/assets";

export type TarotArcana = "major" | "wands" | "cups" | "swords" | "pentacles";
export type TodayTarotCard = TarotDeckAsset;

/**
 * Asset paths live here so the card-selection UI never owns a file path.
 * `null` is an intentional placeholder for cards whose artwork has not arrived yet.
 */
export const todayTarotAssets = {
  cardBackImage: "/tarot/back/today-tarot-card-back.png",
  cardFrontPlaceholderImage: null,
} as const;

/**
 * Keep the interactive deck as a view of the asset registry. The registry has
 * all 78 logical cards even while some artwork is intentionally unavailable.
 */
export const todayTarotDeck: readonly TodayTarotCard[] = allTarotAssets;

export const tarotDeckCapacity: Record<TarotArcana, number> = {
  major: 22,
  wands: 14,
  cups: 14,
  swords: 14,
  pentacles: 14,
};

export const FULL_TAROT_DECK_SIZE = Object.values(tarotDeckCapacity).reduce((total, count) => total + count, 0);

export function getTodayTarotCard(cardId: string) {
  return getTarotAsset(cardId);
}

export function isTodayTarotCardReady(cardId: string) {
  return getTodayTarotCard(cardId)?.imageReady === true;
}

/** Non-mutating Fisher–Yates shuffle. No saju value is accepted or used here. */
export function shuffleTodayTarotDeck(
  cards: readonly TodayTarotCard[] = todayTarotDeck,
  random: () => number = Math.random,
) {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}
