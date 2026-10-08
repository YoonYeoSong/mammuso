import { getTarotAsset } from "@/lib/tarot/assets";
import { getDestinyQuestionIntent, isDestinyReadingType } from "./profiles";
import type { DestinyFinalReading, DestinyPositionInterpretation, DestinyReadingInput, DestinyReadingResponse, DestinySelectedCard, DestinySpreadPosition, DestinyTarotSessionDraft } from "./types";

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
  const prohibitedGenericCopy = /한 가지를 적어보세요|마음에 남는 조건을 적어보세요|현재의 감각과 조건을 확인하세요|서두른 결론보다 천천히 살펴보세요|가능성을 열어두세요|자신을 돌아보세요/;
  const textHasProhibitedGenericCopy = (text: string) => prohibitedGenericCopy.test(text);
  const contextualPositionInterpretation = (item: DestinyPositionInterpretation) => {
    const position = input.positions.find((candidate) => candidate.id === item.spreadPositionId);
    const card = input.cards.find((candidate) => candidate.spreadPositionId === item.spreadPositionId);
    return Boolean(position && card && item.interpretation.includes(position.label) && item.interpretation.includes(card.cardName) && item.interpretation.includes(card.orientation === "upright" ? "정방향" : "역방향"));
  };
  return validIdList(response.revealMessages)
    && response.revealMessages.every((item) => isText(item.message, 8, 360) && !textHasProhibitedGenericCopy(item.message))
    && Array.isArray(reading.positions)
    && validIdList(reading.positions)
    && reading.positions.every((item) => isText(item.interpretation, 18, 1200) && !textHasProhibitedGenericCopy(item.interpretation) && contextualPositionInterpretation(item))
    && isText(reading.overallSummary, 18, 700) && !textHasProhibitedGenericCopy(reading.overallSummary)
    && isText(reading.connections, 18, 1100) && !textHasProhibitedGenericCopy(reading.connections)
    && isText(reading.coreConclusion, 18, 700) && !textHasProhibitedGenericCopy(reading.coreConclusion)
    && isText(reading.actionAdvice, 18, 700) && !textHasProhibitedGenericCopy(reading.actionAdvice);
}

type CardSignal = { score: number; upright: string; reversed: string };

function cardSignal(card: DestinyReadingInput["cards"][number]): CardSignal {
  const majorSignals: Record<string, CardSignal> = {
    "바보": { score: 1, upright: "새롭게 다가가 볼 용기와 가벼운 시작", reversed: "마음은 앞서지만 준비나 타이밍을 한 번 더 맞춰야 하는 부분" },
    "마법사": { score: 2, upright: "말과 행동으로 기회를 만들어 내는 주도성", reversed: "의욕은 있지만 말과 행동의 일치가 필요한 부분" },
    "여사제": { score: 0, upright: "아직 다 드러나지 않은 마음과 조용한 관찰", reversed: "감춰 둔 감정 때문에 판단이 흐려질 수 있는 부분" },
    "여황제": { score: 2, upright: "호감과 돌봄이 자연스럽게 자라나는 힘", reversed: "기대가 커져 상대의 속도를 놓치기 쉬운 부분" },
    "황제": { score: 1, upright: "관계를 안정시키는 기준과 책임감", reversed: "고집이나 통제가 관계를 딱딱하게 만들 수 있는 부분" },
    "교황": { score: 0, upright: "신뢰할 수 있는 방식과 관계의 기준", reversed: "익숙한 규칙이 오히려 선택을 묶을 수 있는 부분" },
    "연인": { score: 2, upright: "서로의 선택과 마음이 맞닿는 연결", reversed: "호감은 있어도 선택이나 가치관이 엇갈리는 부분" },
    "전차": { score: 2, upright: "망설임을 넘어 관계나 일을 전진시키는 추진력", reversed: "서두르다 방향을 잃거나 힘겨루기로 번질 수 있는 부분" },
    "힘": { score: 1, upright: "부드럽지만 꾸준하게 상황을 다루는 인내", reversed: "자신감이 흔들려 반응에 과하게 휘둘릴 수 있는 부분" },
    "은둔자": { score: -1, upright: "혼자 정리할 시간과 신중한 거리", reversed: "필요한 대화까지 피하며 고립될 수 있는 부분" },
    "운명의 수레바퀴": { score: 1, upright: "예상 밖의 전환과 타이밍의 변화", reversed: "변화가 더디거나 같은 패턴이 반복되는 부분" },
    "정의": { score: 0, upright: "감정보다 균형과 사실을 기준으로 보는 태도", reversed: "한쪽 기준으로만 판단해 불공평함이 남는 부분" },
    "매달린 사람": { score: -2, upright: "멈춤을 통해 관점을 바꿔야 하는 시기", reversed: "기다림이 길어져 답답함만 커질 수 있는 부분" },
    "죽음": { score: -1, upright: "기존 방식을 끝내고 관계나 일의 국면을 바꾸는 전환", reversed: "끝내야 할 패턴을 붙잡아 변화가 늦어지는 부분" },
    "절제": { score: 1, upright: "속도를 맞추고 차이를 조율하는 균형", reversed: "리듬이 맞지 않아 감정이나 일정이 엇갈리는 부분" },
    "악마": { score: -2, upright: "집착·불안·익숙한 패턴에 묶일 위험", reversed: "그 패턴을 끊어 낼 여지는 생겼지만 흔들림은 남은 상태" },
    "탑": { score: -3, upright: "숨겨 둔 문제가 드러나 기존 방식이 흔들리는 변화", reversed: "큰 충돌은 피했어도 근본 문제를 미루기 쉬운 부분" },
    "별": { score: 2, upright: "회복에 대한 기대와 다시 이어 볼 수 있는 희망", reversed: "희망은 있으나 자신감이 약해 행동으로 옮기기 어려운 부분" },
    "달": { score: -2, upright: "확신보다 불안과 오해가 앞서는 상태", reversed: "혼란이 조금 걷히지만 아직 확인되지 않은 부분" },
    "태양": { score: 3, upright: "마음을 드러내도 되는 개방감과 긍정적 반응", reversed: "좋은 기운은 있으나 기대만큼 바로 표현되지 않는 부분" },
    "심판": { score: 2, upright: "과거를 돌아보고 다시 답을 낼 수 있는 전환", reversed: "기회를 알아도 과거의 망설임이 발목을 잡는 부분" },
    "세계": { score: 3, upright: "한 단계가 안정적으로 완성되는 결과", reversed: "마무리 직전의 미련이나 남은 과제를 정리해야 하는 부분" },
  };
  if (majorSignals[card.cardName]) return majorSignals[card.cardName];
  const asset = getTarotAsset(card.cardId);
  const rankTheme: Record<number, string> = { 1: "새 출발", 2: "균형과 선택", 3: "협력과 확장", 4: "안정 또는 정체", 5: "긴장과 변화", 6: "회복과 전진", 7: "시험과 점검", 8: "집중과 움직임", 9: "독립과 인내", 10: "마무리와 부담", 11: "새 소식과 탐색", 12: "빠른 전개와 추진", 13: "성숙한 돌봄과 판단", 14: "책임과 주도권" };
  const suitTheme = card.suit === "cups" ? "감정과 교감" : card.suit === "pentacles" ? "현실적인 자원과 안정" : card.suit === "wands" ? "행동력과 의욕" : "판단과 대화";
  const rank = asset?.rank ?? 0;
  const score = card.suit === "swords" ? -1 : rank === 5 || rank === 10 ? -1 : 1;
  return { score, upright: `${suitTheme} 안에서 ${rankTheme[rank] ?? "현재 과제"}이 드러나는 모습`, reversed: `${suitTheme} 안에서 ${rankTheme[rank] ?? "현재 과제"}이 매끄럽게 풀리지 않아 조정이 필요한 모습` };
}

function orientationLabel(orientation: "upright" | "reversed") { return orientation === "upright" ? "정방향" : "역방향"; }

function positionRole(readingType: DestinyReadingInput["readingType"], label: string) {
  if (/(막는|걸림|장애|주의|위험|새는|피할)/.test(label)) return readingType === "love" || readingType === "reunion" ? "가까워지고 싶은 마음만으로 밀어붙이면 오히려 거리가 생길 수 있음을 보여줍니다" : "지금 피하거나 줄여야 할 현실적인 부담을 보여줍니다";
  if (/(상대.*(감정|마음|태도)|드러나지|숨은)/.test(label)) return "상대의 마음을 단정하는 말이 아니라, 현재 관계에서 읽히는 반응의 결을 보여줍니다";
  if (/(기회|계기|강점|매력|자원)/.test(label)) return "지금 이미 활용할 수 있는 기회와 강점을 짚어 줍니다";
  if (/(행동|조언|방향|할 일|지키는)/.test(label)) return "이 카드는 결과를 기다리기보다 어떤 방식으로 움직일지를 구체화합니다";
  if (/(최종|향후|앞으로|가능성|무게|발전)/.test(label)) return "이 자리는 지금 카드 조합이 향하는 다음 방향을 읽는 자리입니다";
  return "이 자리는 질문의 현재 맥락에서 무엇이 실제로 작동하는지 읽는 자리입니다";
}

function domainSubject(readingType: DestinyReadingInput["readingType"]) {
  if (readingType === "love") return "두 사람의 관계";
  if (readingType === "reunion") return "재회와 연락의 관계";
  if (readingType === "money") return "금전 흐름";
  if (readingType === "career") return "일과 진로";
  if (readingType === "choice") return "선택";
  return "이 고민";
}

function directionWord(score: number) { return score >= 3 ? "긍정적으로 움직이는" : score <= -3 ? "조심스럽게 다뤄야 하는" : "천천히 가늠해야 하는"; }

function directConclusion(input: DestinyReadingInput, score: number, intent: string) {
  const direction = directionWord(score);
  if (input.readingType === "love") {
    if (intent === "relationship_progress") return score >= 3 ? "이 관계는 발전 가능성이 비교적 또렷하며, 부담 없는 만남을 통해 자연스럽게 가까워지는 쪽에 무게가 실립니다." : score <= -3 ? "이 관계는 지금 바로 빠르게 발전시키기보다, 엇갈린 반응과 거리감을 풀어야 다음 단계가 보입니다." : "이 관계는 발전 가능성이 닫혀 있지는 않지만, 지금 당장 결론을 내기보다 상대 반응을 보며 천천히 거리를 좁히는 쪽에 가깝습니다.";
    if (intent === "crush_feelings") return score >= 2 ? "상대가 이 관계를 완전히 닫아둔 모습은 아니며, 호감이 행동으로 이어질 여지가 보입니다." : score <= -2 ? "상대의 마음을 긍정으로 단정하기보다, 아직 망설임이나 거리감이 더 크게 읽힙니다." : "상대도 관계를 의식할 수 있지만, 확신보다 조심스러운 관찰이 앞서는 흐름입니다.";
    if (intent === "new_relationship") return score >= 2 ? "새 인연이 들어올 여지가 비교적 열려 있으며, 사람을 만나는 자리를 피하지 않는 편이 좋습니다." : "새 인연의 문이 닫힌 것은 아니지만, 과거의 기준이나 조급함을 내려놓는 시간이 먼저 필요해 보입니다.";
    return `연애에서는 ${direction} 방향이 읽히며, 현재 관계의 속도를 존중하는 쪽이 좋습니다.`;
  }
  if (input.readingType === "money") return score >= 3 ? "금전 흐름에는 기회를 살릴 여지가 보이지만, 무리한 기대보다 실제로 확보되는 조건을 우선해야 합니다." : score <= -3 ? "금전 흐름은 당분간 지출과 손실 가능성을 먼저 관리하는 쪽이 안전합니다." : "금전 흐름은 급격한 변화보다 들어오고 나가는 돈의 균형을 잡는 단계에 가깝습니다.";
  if (input.readingType === "choice") return score >= 2 ? "두 선택 중 더 꾸준히 이어 갈 수 있고 현실 부담을 감당할 수 있는 쪽에 무게가 실립니다." : score <= -2 ? "지금은 어느 한쪽을 성급히 확정하기보다 부담이 큰 선택의 조건을 다시 봐야 합니다." : "두 선택 모두 장단점이 있어, 눈앞의 편안함보다 오래 지킬 기준을 우선하는 쪽이 맞습니다.";
  if (input.readingType === "career") return score >= 2 ? "일과 진로에서는 움직임을 준비해 볼 만한 여지가 보이며, 강점을 보여 줄 행동이 결과를 바꿀 수 있습니다." : score <= -2 ? "진로에서는 지금 당장 큰 결단을 내리기보다 걸림돌과 준비 부족을 먼저 보완하는 편이 낫습니다." : "진로는 급하게 판을 바꾸기보다 기회를 고르며 준비를 쌓는 쪽에 무게가 실립니다.";
  if (input.readingType === "reunion") return score >= 2 ? "재회나 연락의 문이 완전히 닫힌 것은 아니며, 가벼운 접점부터 다시 만드는 쪽에 여지가 있습니다." : score <= -2 ? "재회는 지금 당장 밀어붙이기보다 단절을 만든 문제와 상대의 경계를 존중하는 것이 먼저입니다." : "재회 흐름은 남아 있지만, 연락의 속도와 기대를 낮추고 반응을 보며 접근하는 편이 좋습니다.";
  return `이 고민은 ${direction} 방향으로 읽히며, 카드가 보여 준 강점과 경계할 부분을 함께 반영하는 선택이 필요합니다.`;
}

function actionAdvice(readingType: DestinyReadingInput["readingType"], intent: string, score: number) {
  if (readingType === "love") return intent === "relationship_progress" ? "추천 행동: 부담 없는 둘만의 약속이나 짧은 대화를 한 번 제안해 보세요. 피할 행동: 답장 속도나 관계 정의를 재촉하지 마세요. 관찰할 신호: 상대가 먼저 대화를 이어 가거나 개인적인 시간을 내주는지 보세요." : intent === "crush_feelings" ? "추천 행동: 상대가 편하게 답할 수 있는 가벼운 관심사를 먼저 건네 보세요. 피할 행동: 반응 하나만으로 마음을 단정하거나 확인을 강요하지 마세요. 관찰할 신호: 상대가 질문을 되돌려 주고 대화를 이어 가는지 보세요." : "추천 행동: 새로운 모임이나 지인의 가벼운 제안을 한 번 받아 보세요. 피할 행동: 처음부터 관계의 결론을 정해 두지 마세요. 관찰할 신호: 만남 뒤에도 자연스럽게 연락이 이어지는지 보세요.";
  if (readingType === "money") return score <= -2 ? "추천 행동: 이번 달에 예정된 큰 지출 한 건을 먼저 점검하고, 즉흥 결제는 하루 뒤에 결정하세요. 피할 행동: 불안해서 만회하려는 지출이나 검증되지 않은 제안에 바로 돈을 쓰지 마세요." : "추천 행동: 들어올 수입이나 기회와 연결된 연락·일정을 먼저 챙기세요. 피할 행동: 아직 확정되지 않은 돈을 이미 가진 수입처럼 쓰지 마세요.";
  if (readingType === "choice") return "추천 행동: 두 선택을 각각 한 달 뒤에도 감당할 시간·비용·관계 부담으로 비교해 보세요. 피할 행동: 주변의 조급한 의견만으로 오늘 결론을 내리지 마세요.";
  if (readingType === "career") return intent === "job_change" ? "추천 행동: 이직을 원한다면 이번 주에 이력서 한 항목과 지원 기준 한 가지를 정리해 보세요. 피할 행동: 현재의 답답함만으로 조건을 확인하지 않은 자리를 택하지 마세요." : "추천 행동: 지금 가장 보여 주고 싶은 역량을 한 가지 골라 지원서·포트폴리오·업무 결과에 반영하세요. 피할 행동: 준비가 완벽해질 때까지 지원이나 대화를 미루지 마세요.";
  if (readingType === "reunion") return intent === "reunion_contact" ? "추천 행동: 연락한다면 안부처럼 짧고 답장 부담이 없는 한 번의 메시지로 시작하세요. 피할 행동: 답장이 없을 때 연달아 보내거나 관계의 답을 요구하지 마세요. 관찰할 신호: 상대가 질문을 되돌려 주거나 대화를 스스로 이어 가는지 보세요." : "추천 행동: 다시 이어지고 싶다면 헤어진 이유를 반복하지 않는 한 가지 달라진 태도를 먼저 보여 주세요. 피할 행동: 그리움만으로 상대의 경계를 넘거나 답을 재촉하지 마세요.";
  return "추천 행동: 카드에서 가장 강하게 드러난 기회 한 가지에 이번 주의 작은 행동을 연결하세요. 피할 행동: 불편한 신호를 무시한 채 같은 방식만 반복하지 마세요.";
}

/** A complete local reading stays specific to the question, intent, position, card and orientation when AI is unavailable. */
export function createFallbackDestinyReading(input: DestinyReadingInput): DestinyReadingResponse {
  const cardFor = (positionId: string) => input.cards.find((card) => card.spreadPositionId === positionId)!;
  const intent = getDestinyQuestionIntent(input.readingType, input.finalQuestion);
  const scoredCards = input.cards.map((card) => ({ card, signal: cardSignal(card) }));
  const score = scoredCards.reduce((total, item) => total + (item.card.orientation === "upright" ? item.signal.score : -Math.sign(item.signal.score)), 0);
  const firstPosition = input.positions[0];
  const middlePosition = input.positions[Math.floor(input.positions.length / 2)];
  const lastPosition = input.positions.at(-1)!;
  const firstCard = cardFor(firstPosition.id);
  const middleCard = cardFor(middlePosition.id);
  const lastCard = cardFor(lastPosition.id);
  const interpret = (position: DestinySpreadPosition) => {
    const card = cardFor(position.id);
    const signal = cardSignal(card);
    const meaning = card.orientation === "upright" ? signal.upright : signal.reversed;
    return `${position.label}에서 ${card.cardName} ${orientationLabel(card.orientation)}은 ${domainSubject(input.readingType)}에서 ${meaning}을 보여줍니다. ${positionRole(input.readingType, position.label)} “${input.finalQuestion}”에서는 ${position.description}에 이 카드의 메시지를 적용해 읽는 것이 핵심입니다.`;
  };
  return {
    revealMessages: input.positions.map((position) => {
      const card = cardFor(position.id);
      const signal = cardSignal(card);
      return { spreadPositionId: position.id, message: `${position.label}의 ${card.cardName} ${orientationLabel(card.orientation)}은 ${card.orientation === "upright" ? signal.upright : signal.reversed}을 비춥니다. ${positionRole(input.readingType, position.label)}` };
    }),
    reading: {
      overallSummary: `${directConclusion(input, score, intent)} ${firstPosition.label}의 ${firstCard.cardName} ${orientationLabel(firstCard.orientation)}, ${lastPosition.label}의 ${lastCard.cardName} ${orientationLabel(lastCard.orientation)}이 이 판단의 시작과 도착점을 함께 보여 줍니다.`,
      positions: input.positions.map((position) => ({ spreadPositionId: position.id, interpretation: interpret(position) })),
      connections: `${firstPosition.label}의 ${firstCard.cardName} ${orientationLabel(firstCard.orientation)}은 ${cardSignal(firstCard).upright}을 먼저 드러냅니다. 이어 ${middlePosition.label}의 ${middleCard.cardName} ${orientationLabel(middleCard.orientation)}이 ${cardSignal(middleCard)[middleCard.orientation]}을 더하면서, 마지막 ${lastPosition.label}의 ${lastCard.cardName} ${orientationLabel(lastCard.orientation)}이 ${cardSignal(lastCard)[lastCard.orientation]} 쪽으로 결론을 모읍니다. 그래서 이 조합은 카드 이름을 나열하는 것이 아니라, 현재 조건에서 무엇을 살리고 무엇을 줄일지 말해 줍니다.`,
      coreConclusion: `${directConclusion(input, score, intent)} 핵심 근거는 ${firstPosition.label}의 ${firstCard.cardName} ${orientationLabel(firstCard.orientation)}과 ${lastPosition.label}의 ${lastCard.cardName} ${orientationLabel(lastCard.orientation)}입니다. 이 결과를 확정된 미래가 아니라, 지금 더 유리한 반응과 피해야 할 행동을 가르는 기준으로 받아들이면 좋습니다.`,
      actionAdvice: actionAdvice(input.readingType, intent, score),
    },
  };
}

export function selectedCardsByPosition(selectedCards: DestinySelectedCard[]) {
  return new Map(selectedCards.map((card) => [card.spreadPositionId, card]));
}
