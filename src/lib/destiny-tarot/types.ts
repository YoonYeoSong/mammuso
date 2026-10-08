export type DestinyConversationRole = "assistant" | "user";

export type DestinyConversationMessage = {
  id: string;
  role: DestinyConversationRole;
  content: string;
  quickReplies?: string[];
};

export type DestinyChatReply =
  | { status: "ASK"; acknowledgement: string; question: string; quickReplies: string[] }
  | { status: "READY"; assistantMessage: string; summary: string; finalQuestion: string };

export type DestinyOrientationMode = "uprightOnly" | "mixed";
export type DestinyCardCount = 3 | 5 | 10;
export type DestinyReadingType = "love" | "money" | "choice" | "career" | "reunion" | "general";
export type DestinyDeckViewMode = "fan" | "grid";
export type DestinySpreadTemplate = "linear" | "choice" | "relationship" | "cross" | "deep";

export type DestinyCardCountRecommendation = {
  recommendedCardCount: DestinyCardCount;
  reason: string;
};

export type DestinySpreadPosition = {
  id: string;
  order: number;
  label: string;
  description: string;
};

export type DestinySpread = {
  template: DestinySpreadTemplate;
  positions: DestinySpreadPosition[];
};

export type DestinySelectedCard = {
  cardId: string;
  spreadPositionId: string;
  selectedOrder: number;
  orientation: "upright" | "reversed";
};

export type DestinyReadingCard = {
  spreadPositionId: string;
  cardId: string;
  cardName: string;
  orientation: "upright" | "reversed";
  arcana: "major" | "minor";
  suit: "wands" | "cups" | "swords" | "pentacles" | null;
};

export type DestinyReadingInput = {
  readingType: DestinyReadingType;
  concernSummary: string;
  finalQuestion: string;
  cardCount: DestinyCardCount;
  spreadTemplate: DestinySpreadTemplate;
  positions: DestinySpreadPosition[];
  cards: DestinyReadingCard[];
};

export type DestinyRevealMessage = {
  spreadPositionId: string;
  message: string;
};

export type DestinyPositionInterpretation = {
  spreadPositionId: string;
  interpretation: string;
};

export type DestinyFinalReading = {
  overallSummary: string;
  positions: DestinyPositionInterpretation[];
  connections: string;
  coreConclusion: string;
  actionAdvice: string;
};

export type DestinyReadingResponse = {
  revealMessages: DestinyRevealMessage[];
  reading: DestinyFinalReading;
};

/**
 * Phase 1 saves the conversational foundation; the optional fields are the
 * stable hand-off contract for the later spread, selection, and reveal phases.
 */
export type DestinyTarotSessionDraft = {
  readingType: DestinyReadingType;
  originalConcern: string;
  conversation: DestinyConversationMessage[];
  summary: string;
  /** Kept alongside the Phase 1 name so the reading session has an explicit concern field. */
  concernSummary: string;
  finalQuestion: string;
  orientationMode?: DestinyOrientationMode;
  cardCount?: DestinyCardCount;
  recommendedCardCount: DestinyCardCount | null;
  recommendationReason?: string | null;
  spreadTemplate?: DestinySpreadTemplate;
  spreadPositions?: DestinySpreadPosition[];
  deckOrder?: string[];
  selectedCards?: DestinySelectedCard[];
  viewMode: DestinyDeckViewMode;
};

export const MAX_DESTINY_FOLLOW_UPS = 4;
