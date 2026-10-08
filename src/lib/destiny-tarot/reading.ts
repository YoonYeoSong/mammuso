import { getTarotAsset } from "@/lib/tarot/assets";
import { isDestinyReadingType } from "./profiles";
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
    readingType: session.readingType,
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
  if (!isDestinyReadingType(input.readingType) || !cardCounts.includes(input.cardCount as (typeof cardCounts)[number]) || !templates.includes(input.spreadTemplate as (typeof templates)[number]) || !isText(input.concernSummary, 2, 300) || !isText(input.finalQuestion, 8, 320) || !Array.isArray(input.positions) || !Array.isArray(input.cards)) return false;
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
  const firstPosition = input.positions[0];
  const lastPosition = input.positions.at(-1)!;
  const firstCard = cardFor(firstPosition.id);
  const lastCard = cardFor(lastPosition.id);
  return {
    revealMessages: input.positions.map((position) => {
      const card = cardFor(position.id);
      return { spreadPositionId: position.id, message: `${position.label}의 자리에서 ${card.cardName} 카드는 ${orientationWord(card.orientation)} 흐름을 비춰요. 지금의 마음과 조건을 한 번 더 살피며 받아들여 보세요.` };
    }),
    reading: {
      overallSummary: `이번 리딩은 “${input.finalQuestion}”에 대해 결론을 서두르기보다, 현재 조건을 확인한 뒤 다음 선택을 준비하는 쪽에 무게를 둡니다. 특히 ${firstPosition.label}의 ${firstCard.cardName} ${firstCard.orientation === "reversed" ? "역방향" : "정방향"}과 ${lastPosition.label}의 ${lastCard.cardName} ${lastCard.orientation === "reversed" ? "역방향" : "정방향"}이 시작과 다음 방향을 함께 살피게 합니다.`,
      positions: input.positions.map((position) => {
        const card = cardFor(position.id);
        return { spreadPositionId: position.id, interpretation: `${position.label}은 ${position.description} ${card.cardName}의 ${card.orientation === "reversed" ? "역방향" : "정방향"}은 이 자리를 서두른 결론보다 현재의 감각과 조건을 세심하게 확인하는 흐름으로 읽게 합니다. 이 카드가 떠올리게 하는 한 가지를 구체적으로 적어보면 좋겠어요.` };
      }),
      connections: `${firstPosition.label}의 ${firstCard.cardName}에서 출발한 시선이 ${lastPosition.label}의 ${lastCard.cardName}까지 이어집니다. 앞자리에서 확인한 마음과 조건을 다음 자리의 조언과 함께 놓을 때, 어느 한쪽으로 급하게 기울기보다 근거 있는 선택을 준비할 수 있습니다.`,
      coreConclusion: `이번 리딩은 “${input.finalQuestion}”에 대해, 지금 당장 답을 확정하기보다 다음 선택을 실제로 준비하는 쪽에 무게를 둡니다. ${firstPosition.label}의 ${firstCard.cardName} ${firstCard.orientation === "reversed" ? "역방향" : "정방향"}과 ${lastPosition.label}의 ${lastCard.cardName} ${lastCard.orientation === "reversed" ? "역방향" : "정방향"}이 현재의 확인과 다음 방향을 함께 보여줍니다. 그래서 오늘은 결론을 미루는 것이 아니라, 선택에 필요한 조건을 한 가지라도 확인하며 받아들이는 것이 좋습니다.`,
      actionAdvice: `${firstPosition.label}과 ${lastPosition.label}에서 가장 마음에 남는 조건을 하나씩 적고, 두 조건을 모두 만족시키려면 이번 주에 할 수 있는 가장 작은 행동 하나를 정해보세요.`,
    },
  };
}

export function selectedCardsByPosition(selectedCards: DestinySelectedCard[]) {
  return new Map(selectedCards.map((card) => [card.spreadPositionId, card]));
}
