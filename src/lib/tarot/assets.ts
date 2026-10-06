import type { TarotCard } from "./cards";

export type WandCardRank =
  | "ace"
  | "two"
  | "three"
  | "four"
  | "five"
  | "six"
  | "seven"
  | "eight"
  | "nine"
  | "ten"
  | "page"
  | "knight"
  | "queen"
  | "king";

export type CupCardRank = WandCardRank;
export type SwordCardRank = WandCardRank;
export type PentaclesCardRank = WandCardRank;
export type TarotSuit = "wands" | "cups" | "swords" | "pentacles";
export type TarotDeckArcana = "major" | "minor";

/**
 * The canonical card record for every interactive tarot surface. Artwork can
 * be unavailable while the card itself remains part of the 78-card deck.
 */
export type TarotDeckAsset = {
  id: string;
  arcana: TarotDeckArcana;
  suit: TarotSuit | null;
  rank: number;
  nameKo: string;
  nameEn: string;
  image: string;
  imageReady: boolean;
};

const asPng = (file: string) => `${file}.png`;

const wandArtworkFiles: Record<WandCardRank, string> = {
  ace: "01-ace-of-wands",
  two: "02-two-of-wands",
  three: "03-three-of-wands",
  four: "04-four-of-wands",
  five: "05-five-of-wands",
  six: "06-six-of-wands",
  seven: "07-seven-of-wands",
  eight: "08-eight-of-wands",
  nine: "09-nine-of-wands",
  ten: "10-ten-of-wands",
  page: "11-page-of-wands",
  knight: "12-knight-of-wands",
  queen: "13-queen-of-wands",
  king: "14-king-of-wands",
};

const cupArtworkFiles: Record<CupCardRank, string> = {
  ace: "01-ace-of-cups",
  two: "02-two-of-cups",
  three: "03-three-of-cups",
  four: "04-four-of-cups",
  five: "05-five-of-cups",
  six: "06-six-of-cups",
  seven: "07-seven-of-cups",
  eight: "08-eight-of-cups",
  nine: "09-nine-of-cups",
  ten: "10-ten-of-cups",
  page: "11-page-of-cups",
  knight: "12-knight-of-cups",
  queen: "13-queen-of-cups",
  king: "14-king-of-cups",
};

const swordArtworkFiles: Record<SwordCardRank, string> = {
  ace: "01-ace-of-swords",
  two: "02-two-of-swords",
  three: "03-three-of-swords",
  four: "04-four-of-swords",
  five: "05-five-of-swords",
  six: "06-six-of-swords",
  seven: "07-seven-of-swords",
  eight: "08-eight-of-swords",
  nine: "09-nine-of-swords",
  ten: "10-ten-of-swords",
  page: "11-page-of-swords",
  knight: "12-knight-of-swords",
  queen: "13-queen-of-swords",
  king: "14-king-of-swords",
};

const pentaclesArtworkFiles: Record<PentaclesCardRank, string> = {
  ace: "01-ace-of-pentacles",
  two: "02-two-of-pentacles",
  three: "03-three-of-pentacles",
  four: "04-four-of-pentacles",
  five: "05-five-of-pentacles",
  six: "06-six-of-pentacles",
  seven: "07-seven-of-pentacles",
  eight: "08-eight-of-pentacles",
  nine: "09-nine-of-pentacles",
  ten: "10-ten-of-pentacles",
  page: "11-page-of-pentacles",
  knight: "12-knight-of-pentacles",
  queen: "13-queen-of-pentacles",
  king: "14-king-of-pentacles",
};

export function tarotArtworkPath(card: TarotCard) {
  return `/tarot/arcana/${String(card.number).padStart(2, "0")}-${card.id}.png`;
}

export function wandArtworkPath(rank: WandCardRank) {
  return `/tarot/wands/${asPng(wandArtworkFiles[rank])}`;
}

export function cupArtworkPath(rank: CupCardRank) {
  return `/tarot/cups/${asPng(cupArtworkFiles[rank])}`;
}

export function swordArtworkPath(rank: SwordCardRank) {
  return `/tarot/swords/${asPng(swordArtworkFiles[rank])}`;
}

export function pentaclesArtworkPath(rank: PentaclesCardRank) {
  return `/tarot/pentacles/${asPng(pentaclesArtworkFiles[rank])}`;
}

const majorCards = [
  ["fool", "바보", "The Fool"], ["magician", "마법사", "The Magician"],
  ["high-priestess", "여사제", "The High Priestess"], ["empress", "여황제", "The Empress"],
  ["emperor", "황제", "The Emperor"], ["hierophant", "교황", "The Hierophant"],
  ["lovers", "연인", "The Lovers"], ["chariot", "전차", "The Chariot"],
  ["strength", "힘", "Strength"], ["hermit", "은둔자", "The Hermit"],
  ["wheel-of-fortune", "운명의 수레바퀴", "Wheel of Fortune"], ["justice", "정의", "Justice"],
  ["hanged-man", "매달린 사람", "The Hanged Man"], ["death", "죽음", "Death"],
  ["temperance", "절제", "Temperance"], ["devil", "악마", "The Devil"],
  ["tower", "탑", "The Tower"], ["star", "별", "The Star"], ["moon", "달", "The Moon"],
  ["sun", "태양", "The Sun"], ["judgement", "심판", "Judgement"], ["world", "세계", "The World"],
] as const;

const minorRanks = [
  ["ace", "에이스", "Ace"], ["two", "2", "Two"], ["three", "3", "Three"],
  ["four", "4", "Four"], ["five", "5", "Five"], ["six", "6", "Six"],
  ["seven", "7", "Seven"], ["eight", "8", "Eight"], ["nine", "9", "Nine"],
  ["ten", "10", "Ten"], ["page", "페이지", "Page"], ["knight", "나이트", "Knight"],
  ["queen", "퀸", "Queen"], ["king", "킹", "King"],
] as const satisfies ReadonlyArray<readonly [WandCardRank, string, string]>;

const suitNames: Record<TarotSuit, { ko: string; en: string }> = {
  wands: { ko: "완드", en: "Wands" },
  cups: { ko: "컵", en: "Cups" },
  swords: { ko: "소드", en: "Swords" },
  pentacles: { ko: "펜타클", en: "Pentacles" },
};

function minorArtworkPath(suit: TarotSuit, rank: WandCardRank) {
  if (suit === "wands") return wandArtworkPath(rank);
  if (suit === "cups") return cupArtworkPath(rank);
  if (suit === "swords") return swordArtworkPath(rank);
  return pentaclesArtworkPath(rank);
}

const majorTarotAssets: TarotDeckAsset[] = majorCards.map(([slug, nameKo, nameEn], rank) => ({
  id: `major-${String(rank).padStart(2, "0")}`,
  arcana: "major",
  suit: null,
  rank,
  nameKo,
  nameEn,
  image: `/tarot/arcana/${String(rank).padStart(2, "0")}-${slug}.png`,
  imageReady: true,
}));

function createMinorTarotAssets(suit: TarotSuit): TarotDeckAsset[] {
  return minorRanks.map(([slug, rankKo, rankEn], index) => ({
    id: `${suit}-${String(index + 1).padStart(2, "0")}`,
    arcana: "minor",
    suit,
    rank: index + 1,
    nameKo: `${suitNames[suit].ko} ${rankKo}`,
    nameEn: `${rankEn} of ${suitNames[suit].en}`,
    image: minorArtworkPath(suit, slug),
    imageReady: true,
  }));
}

/** The single 78-card metadata and artwork mapping source of truth. */
export const allTarotAssets: readonly TarotDeckAsset[] = [
  ...majorTarotAssets,
  ...createMinorTarotAssets("wands"),
  ...createMinorTarotAssets("cups"),
  ...createMinorTarotAssets("swords"),
  ...createMinorTarotAssets("pentacles"),
];

export function getTarotAsset(cardId: string) {
  return allTarotAssets.find((card) => card.id === cardId);
}
