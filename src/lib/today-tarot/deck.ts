export type TarotArcana = "major" | "wands" | "cups" | "swords" | "pentacles";

export type TodayTarotCard = {
  id: string;
  number: number;
  nameKo: string;
  nameEn: string;
  arcana: TarotArcana;
  image: string | null;
};

/**
 * Asset paths live here so the card-selection UI never owns a file path.
 * `null` is an intentional placeholder for cards whose artwork has not arrived yet.
 */
export const todayTarotAssets = {
  cardBackImage: "/tarot/back/tarot-card-back.png",
  cardFrontPlaceholderImage: null,
} as const;

/**
 * The production deck will contain 78 cards. Keep additions in this list only;
 * the selection flow must shuffle these cards independently of any saju context.
 */
export const todayTarotDeck: readonly TodayTarotCard[] = [
  {
    id: "major-00",
    number: 0,
    nameKo: "바보",
    nameEn: "The Fool",
    arcana: "major",
    image: "/tarot/arcana/00-fool.png",
  },
] as const;

export const tarotDeckCapacity: Record<TarotArcana, number> = {
  major: 22,
  wands: 14,
  cups: 14,
  swords: 14,
  pentacles: 14,
};

export const FULL_TAROT_DECK_SIZE = Object.values(tarotDeckCapacity).reduce((total, count) => total + count, 0);

export function getTodayTarotCard(cardId: string) {
  return todayTarotDeck.find((card) => card.id === cardId);
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
