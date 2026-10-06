import { getTarotAsset } from "@/lib/tarot/assets";
import type { DestinyFinalReading, DestinyReadingInput, DestinyReadingResponse, DestinySelectedCard, DestinySpreadPosition, DestinyTarotSessionDraft } from "./types";

const cardCounts = [3, 5, 10] as const;
const templates = ["linear", "choice", "relationship", "cross", "deep"] as const;

function isText(value: unknown, min = 1, max = 900): value is string {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}

function sortedPositions(positions: DestinySpreadPosition[]) {
  return [...positions].sort((left, right) => left.order - right.order);
}

/** Rebuilds card context from the one canonical 78-card metadata source. */
export function createDestinyReadingInput(session: DestinyTarotSessionDraft): DestinyReadingInput | null {
  if (!cardCounts.includes(session.cardCount as (typeof cardCounts)[number]) || !templates.includes(session.spreadTemplate as (typeof templates)[number])) return null;
  const positions = session.spreadPositions;
  const selectedCards = session.selectedCards;
  if (!positions || !selectedCards || positions.length !== session.cardCount || selectedCards.length !== session.cardCount) return null;

  const orderedPositions = sortedPositions(positions);
  const validPositions = orderedPositions.every((position, index) => position.id === `position-${index + 1}` && position.order === index + 1 && isText(position.label, 1, 40) && isText(position.description, 1, 220));
  if (!validPositions || new Set(selectedCards.map((card) => card.cardId)).size !== selectedCards.length) return null;

  const cardsByPosition = new Map(selectedCards.map((card) => [card.spreadPositionId, card]));
  if (cardsByPosition.size !== selectedCards.length) return null;
  const cards = orderedPositions.map((position) => {
    const selected = cardsByPosition.get(position.id);
    const asset = selected ? getTarotAsset(selected.cardId) : undefined;
    if (!selected || !asset || !asset.imageReady || !["upright", "reversed"].includes(selected.orientation)) return null;
    return {
      spreadPositionId: position.id,
      cardId: asset.id,
      cardName: asset.nameKo,
      orientation: selected.orientation,
      arcana: asset.arcana,
      suit: asset.suit,
    } as const;
  });
  if (cards.some((card) => card === null)) return null;

  return {
    concernSummary: session.concernSummary || session.summary,
    finalQuestion: session.finalQuestion,
    cardCount: session.cardCount,
    spreadTemplate: session.spreadTemplate as DestinyReadingInput["spreadTemplate"],
    positions: orderedPositions,
    cards: cards as NonNullable<typeof cards[number]>[],
  };
}

export function isValidDestinyReadingInput(value: unknown): value is DestinyReadingInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<DestinyReadingInput>;
  if (!cardCounts.includes(input.cardCount as (typeof cardCounts)[number]) || !templates.includes(input.spreadTemplate as (typeof templates)[number]) || !isText(input.concernSummary, 2, 300) || !isText(input.finalQuestion, 8, 320) || !Array.isArray(input.positions) || !Array.isArray(input.cards)) return false;
  if (input.positions.length !== input.cardCount || input.cards.length !== input.cardCount) return false;
  const ids = new Set(input.positions.map((position) => position.id));
  return ids.size === input.cardCount && input.positions.every((position, index) => position.id === `position-${index + 1}` && position.order === index + 1 && isText(position.label, 1, 40) && isText(position.description, 1, 220))
    && input.cards.every((card) => ids.has(card.spreadPositionId) && isText(card.cardId, 1, 60) && isText(card.cardName, 1, 60) && (card.orientation === "upright" || card.orientation === "reversed"));
}

/** The API never trusts client-supplied names, suits, or arcana metadata. */
export function canonicalizeDestinyReadingInput(value: unknown): DestinyReadingInput | null {
  if (!isValidDestinyReadingInput(value)) return null;
  const cards = value.cards.map((card) => {
    const asset = getTarotAsset(card.cardId);
    if (!asset || !asset.imageReady) return null;
    return {
      spreadPositionId: card.spreadPositionId,
      cardId: asset.id,
      cardName: asset.nameKo,
      orientation: card.orientation,
      arcana: asset.arcana,
      suit: asset.suit,
    };
  });
  if (cards.some((card) => card === null) || new Set(cards.map((card) => card?.cardId)).size !== cards.length) return null;
  return { ...value, cards: cards as DestinyReadingInput["cards"] };
}

export function isValidDestinyReading(value: unknown, input: DestinyReadingInput): value is DestinyReadingResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Partial<DestinyReadingResponse>;
  if (!Array.isArray(response.revealMessages) || !response.reading || typeof response.reading !== "object") return false;
  const reading = response.reading as Partial<DestinyFinalReading>;
  const expectedIds = input.positions.map((position) => position.id);
  const validIdList = (items: Array<{ spreadPositionId: string }>) => items.length === expectedIds.length && new Set(items.map((item) => item.spreadPositionId)).size === expectedIds.length && items.every((item) => expectedIds.includes(item.spreadPositionId));
  return validIdList(response.revealMessages)
    && response.revealMessages.every((item) => isText(item.message, 8, 360))
    && Array.isArray(reading.positions)
    && validIdList(reading.positions)
    && reading.positions.every((item) => isText(item.interpretation, 18, 1200))
    && isText(reading.overallSummary, 18, 700)
    && isText(reading.connections, 18, 1100)
    && isText(reading.coreConclusion, 18, 700)
    && isText(reading.actionAdvice, 18, 700);
}

function orientationWord(orientation: "upright" | "reversed") {
  return orientation === "reversed" ? "내면에서 천천히 조정되는" : "비교적 또렷하게 드러나는";
}

/** A complete local reading keeps the selected spread available if the AI is unreachable. */
export function createFallbackDestinyReading(input: DestinyReadingInput): DestinyReadingResponse {
  const cardFor = (positionId: string) => input.cards.find((card) => card.spreadPositionId === positionId)!;
  return {
    revealMessages: input.positions.map((position) => {
      const card = cardFor(position.id);
      return { spreadPositionId: position.id, message: `${position.label}의 자리에서 ${card.cardName} 카드는 ${orientationWord(card.orientation)} 흐름을 비춰요. 지금의 마음과 조건을 한 번 더 살피며 받아들여 보세요.` };
    }),
    reading: {
      overallSummary: `${input.cardCount}장의 카드는 질문을 한 번에 단정하기보다, 지금의 마음과 선택의 조건을 차례로 살펴보라고 이야기해요. 각 자리에서 느껴지는 부분을 연결해 보면 다음 행동의 우선순위가 조금 더 선명해질 수 있어요.`,
      positions: input.positions.map((position) => {
        const card = cardFor(position.id);
        return { spreadPositionId: position.id, interpretation: `${position.label}은 ${position.description} ${card.cardName}의 ${card.orientation === "reversed" ? "역방향" : "정방향"}은 이 자리를 서두른 결론보다 현재의 감각과 조건을 세심하게 확인하는 흐름으로 읽게 합니다. 이 카드가 떠올리게 하는 한 가지를 구체적으로 적어보면 좋겠어요.` };
      }),
      connections: `각 카드는 독립된 답이라기보다 서로의 빈칸을 채우는 관점이에요. 앞자리에서 확인한 마음을 다음 자리의 조건과 함께 놓고 보면, 한쪽으로 급하게 기울지 않고 균형 잡힌 선택을 준비할 수 있습니다.`,
      coreConclusion: "이번 리딩은 정답을 미리 정하기보다, 내 마음의 기준과 현실의 조건을 함께 확인할 때 다음 방향이 또렷해질 수 있음을 시사해요.",
      actionAdvice: "오늘은 가장 마음에 남는 자리 하나를 골라, 그 카드가 떠올리게 한 사실과 바라는 점을 각각 한 문장으로 적어보세요. 작은 확인이 다음 선택을 훨씬 편안하게 만들어줄 수 있어요.",
    },
  };
}

export function selectedCardsByPosition(selectedCards: DestinySelectedCard[]) {
  return new Map(selectedCards.map((card) => [card.spreadPositionId, card]));
}
