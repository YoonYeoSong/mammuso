export type DestinyConversationRole = "assistant" | "user";

export type DestinyConversationMessage = {
  id: string;
  role: DestinyConversationRole;
  content: string;
  quickReplies?: string[];
};

export type DestinyChatReply =
  | { status: "ASK"; assistantMessage: string; quickReplies: string[] }
  | { status: "READY"; assistantMessage: string; summary: string; finalQuestion: string };

export type DestinyOrientationMode = "uprightOnly" | "mixed";
export type DestinyCardCount = 3 | 5 | 10;
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

/**
 * Phase 1 saves the conversational foundation; the optional fields are the
 * stable hand-off contract for the later spread, selection, and reveal phases.
 */
export type DestinyTarotSessionDraft = {
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
