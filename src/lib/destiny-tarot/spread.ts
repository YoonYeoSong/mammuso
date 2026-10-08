import { allTarotAssets } from "@/lib/tarot/assets";
import type { DestinyCardCount, DestinyOrientationMode, DestinySpread, DestinySpreadPosition, DestinySpreadTemplate } from "./types";

export const DESTINY_DECK_SIZE = allTarotAssets.length;

const templateNames: readonly DestinySpreadTemplate[] = ["linear", "choice", "relationship", "cross", "deep"];
const cardCounts: readonly DestinyCardCount[] = [3, 5, 10];

const fallbackPositions: Record<DestinyCardCount, ReadonlyArray<readonly [string, string]>> = {
  3: [
    ["현재 상황", "지금 질문을 둘러싼 가장 중요한 흐름"],
    ["흐름", "이 고민이 움직이고 있는 방향"],
    ["조언", "지금 마음에 담아둘 태도와 방향"],
  ],
  5: [
    ["현재 상황", "지금 질문을 둘러싼 핵심 상태"],
    ["중요한 영향", "결정에 힘을 보태거나 흔드는 요소"],
    ["선택의 흐름", "지금 선택이 만들어갈 움직임"],
    ["앞으로의 방향", "한 걸음 더 살펴볼 수 있는 방향"],
    ["조언", "지금 나에게 필요한 태도와 시선"],
  ],
  10: [
    ["현재 상황", "지금 질문의 중심에 있는 상태"],
    ["배경", "이 고민이 여기까지 오게 된 흐름"],
    ["내면", "내 마음속에서 작동하는 바람과 두려움"],
    ["외부 영향", "주변 환경과 관계가 주는 영향"],
    ["장애물", "선택을 어렵게 만드는 지점"],
    ["가능성", "아직 충분히 보이지 않은 가능성"],
    ["변화", "움직이기 시작할 수 있는 부분"],
    ["중요한 변수", "결정에 영향을 주는 핵심 조건"],
    ["앞으로의 흐름", "현재 선택이 이어갈 수 있는 흐름"],
    ["조언", "지금 나에게 필요한 방향과 태도"],
  ],
};

export function isDestinyCardCount(value: unknown): value is DestinyCardCount {
  return typeof value === "number" && cardCounts.includes(value as DestinyCardCount);
}

export function isDestinySpreadTemplate(value: unknown): value is DestinySpreadTemplate {
  return typeof value === "string" && templateNames.includes(value as DestinySpreadTemplate);
}

export function defaultDestinySpreadTemplate(cardCount: DestinyCardCount): DestinySpreadTemplate {
  if (cardCount === 3) return "linear";
  if (cardCount === 5) return "cross";
  return "deep";
}

export function createFallbackDestinySpread(cardCount: DestinyCardCount): DestinySpread {
  return {
    template: defaultDestinySpreadTemplate(cardCount),
    positions: fallbackPositions[cardCount].map(([label, description], index) => ({
      id: `position-${index + 1}`,
      order: index + 1,
      label,
      description,
    })),
  };
}

/** Validates untrusted AI JSON before it becomes part of a reading session. */
export function isValidDestinySpread(value: unknown, cardCount: DestinyCardCount): value is DestinySpread {
  if (!value || typeof value !== "object") return false;
  const spread = value as Partial<DestinySpread>;
  if (!isDestinySpreadTemplate(spread.template) || !Array.isArray(spread.positions) || spread.positions.length !== cardCount) return false;

  const ids = new Set<string>();
  return spread.positions.every((position, index) => {
    if (!position || typeof position !== "object") return false;
    const candidate = position as Partial<DestinySpreadPosition>;
    const valid = typeof candidate.id === `position-${index + 1}`
      && typeof candidate.order === "number" && candidate.order === index + 1
      && typeof candidate.label === "string" && candidate.label.trim().length > 0 && candidate.label.trim().length <= 32
      && typeof candidate.description === "string" && candidate.description.trim().length > 0 && candidate.description.trim().length <= 180;
    if (!valid || ids.has(candidate.id!)) return false;
    ids.add(candidate.id!);
    return true;
  });
}

export function normalizeDestinySpread(value: unknown, cardCount: DestinyCardCount, fallback: DestinySpread = createFallbackDestinySpread(cardCount)): DestinySpread {
  if (!isValidDestinySpread(value, cardCount)) return fallback;
  return {
    template: value.template,
    positions: value.positions.map((position) => ({
      id: position.id,
      order: position.order,
      label: position.label.trim(),
      description: position.description.trim(),
    })),
  };
}

/** Non-mutating Fisher–Yates shuffle. The caller stores the result exactly once. */
export function createDestinyDeckOrder(random: () => number = Math.random): string[] {
  const order = allTarotAssets.map((card) => card.id);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }
  return order;
}

export function hasStableDestinyDeckOrder(order: unknown): order is string[] {
  return Array.isArray(order) && order.length === DESTINY_DECK_SIZE && new Set(order).size === DESTINY_DECK_SIZE && order.every((id) => allTarotAssets.some((card) => card.id === id));
}

/** Called only after a user picks a card; its output is then persisted with that card. */
export function selectDestinyOrientation(mode: DestinyOrientationMode, random: () => number = Math.random): "upright" | "reversed" {
  return mode === "uprightOnly" || random() < 0.5 ? "upright" : "reversed";
}
