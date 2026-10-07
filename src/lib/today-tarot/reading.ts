import type { TodayTarotCard } from "./deck";

type Orientation = "upright" | "reversed";
type LuckScore = 1 | 2 | 3 | 4 | 5;

export type TodayTarotInterpretation = {
  headline: string;
  lead: string;
  flow: string;
  mainDetail: string;
  clarifierDetail?: string;
  action: string;
  keywords: string[];
  overallLuck: LuckScore;
  loveLuck: LuckScore;
  moneyLuck: LuckScore;
  overallLuckText: string;
  loveLuckText: string;
  moneyLuckText: string;
  caution: string;
  goodToDo: string;
  oneLiner: string;
};

type Fortune = { overall: number; love: number; money: number; direction: string; reason: string; action: string; keywords: string[] };

const majorFortunes: Record<number, Fortune> = {
  0: { overall: 4, love: 3, money: 3, direction: "가벼운 시작", reason: "새로운 바람을 타는 카드", action: "망설이던 연락이나 일을 작게라도 먼저 열어보세요.", keywords: ["시작", "호기심", "가벼움"] },
  1: { overall: 5, love: 4, money: 4, direction: "먼저 움직이는 흐름", reason: "손에 든 기회를 쓰는 카드", action: "오늘 필요한 연락이나 제안은 미루지 말고 먼저 꺼내보세요.", keywords: ["실행", "기회", "집중"] },
  2: { overall: 3, love: 3, money: 3, direction: "조용히 살피는 흐름", reason: "겉보다 속마음을 읽는 카드", action: "바로 답을 내리기보다 한 번 더 보고 결정하세요.", keywords: ["직감", "관찰", "여백"] },
  3: { overall: 5, love: 5, money: 4, direction: "풍요가 붙는 흐름", reason: "사람과 기회가 자라나는 카드", action: "좋았던 사람에게 먼저 안부를 건네보세요.", keywords: ["풍요", "매력", "여유"] },
  4: { overall: 4, love: 3, money: 4, direction: "기준을 잡는 흐름", reason: "흔들린 일을 정리하는 카드", action: "오늘 꼭 지킬 기준 하나를 정해두세요.", keywords: ["기준", "안정", "정리"] },
  5: { overall: 3, love: 3, money: 3, direction: "익숙한 도움을 쓰는 흐름", reason: "약속과 조언의 카드", action: "혼자 끌지 말고 믿을 만한 사람의 말을 참고해보세요.", keywords: ["조언", "약속", "배움"] },
  6: { overall: 4, love: 5, money: 3, direction: "마음이 통하는 흐름", reason: "관계와 선택의 카드", action: "애매했던 마음은 너무 돌려 말하지 말고 자연스럽게 표현해보세요.", keywords: ["연결", "선택", "솔직함"] },
  7: { overall: 5, love: 3, money: 4, direction: "밀고 나가는 흐름", reason: "방향과 추진력을 잡는 카드", action: "오늘의 우선순위 하나부터 끝내보세요.", keywords: ["전진", "의지", "속도"] },
  8: { overall: 4, love: 4, money: 3, direction: "부드럽게 버티는 흐름", reason: "힘을 조절하는 카드", action: "급한 반응 대신 한 박자 쉬고 말해보세요.", keywords: ["용기", "인내", "균형"] },
  9: { overall: 2, love: 2, money: 3, direction: "혼자 정리하는 흐름", reason: "거리와 성찰의 카드", action: "사람들 말보다 내 판단에 필요한 정보만 골라보세요.", keywords: ["거리", "정리", "선명함"] },
  10: { overall: 4, love: 3, money: 4, direction: "판이 바뀌는 흐름", reason: "타이밍과 전환의 카드", action: "고정된 계획 하나는 유연하게 바꿀 여지를 남겨두세요.", keywords: ["전환", "타이밍", "변화"] },
  11: { overall: 3, love: 3, money: 4, direction: "균형을 따지는 흐름", reason: "공정한 판단의 카드", action: "결정 전 장점과 부담을 같은 무게로 확인해보세요.", keywords: ["균형", "판단", "기준"] },
  12: { overall: 2, love: 2, money: 2, direction: "잠깐 멈춰 보는 흐름", reason: "시선을 바꾸는 카드", action: "지금 답이 안 나는 일은 오늘만큼은 억지로 밀지 마세요.", keywords: ["멈춤", "관점", "여백"] },
  13: { overall: 2, love: 2, money: 3, direction: "정리하고 넘기는 흐름", reason: "끝과 변화의 카드", action: "더는 도움 안 되는 일 하나를 깔끔하게 끝내보세요.", keywords: ["변화", "정리", "전환"] },
  14: { overall: 4, love: 4, money: 3, direction: "알맞은 속도를 찾는 흐름", reason: "조율과 회복의 카드", action: "과한 계획 하나를 조금 덜어내고 리듬을 맞춰보세요.", keywords: ["조율", "회복", "균형"] },
  15: { overall: 2, love: 2, money: 2, direction: "유혹을 가려내는 흐름", reason: "집착과 과욕을 비추는 카드", action: "끌리지만 찜찜한 선택은 오늘 바로 확정하지 마세요.", keywords: ["경계", "선택", "거리"] },
  16: { overall: 1, love: 2, money: 2, direction: "예상 밖 변수를 정리하는 흐름", reason: "갑작스러운 깨달음의 카드", action: "계획이 틀어져도 바로 결론 내리지 말고 대안을 하나 만들어보세요.", keywords: ["재정비", "변수", "전환"] },
  17: { overall: 5, love: 4, money: 4, direction: "기분 좋은 회복의 흐름", reason: "희망과 회복의 카드", action: "작게라도 기대하던 일에 먼저 손을 내밀어보세요.", keywords: ["희망", "회복", "신뢰"] },
  18: { overall: 2, love: 2, money: 2, direction: "헷갈림을 걷어내는 흐름", reason: "감정과 사실이 섞이기 쉬운 카드", action: "들은 말과 내가 짐작한 말을 구분해보세요.", keywords: ["점검", "직감", "차분함"] },
  19: { overall: 5, love: 5, money: 4, direction: "밝게 드러나는 흐름", reason: "활력과 호감의 카드", action: "반가운 마음이나 고마움을 먼저 표현해보세요.", keywords: ["기쁨", "호감", "활력"] },
  20: { overall: 4, love: 3, money: 4, direction: "미뤄둔 답을 내는 흐름", reason: "다시 들리는 신호의 카드", action: "계속 미뤄둔 연락이나 결정 하나를 처리해보세요.", keywords: ["결정", "응답", "정리"] },
  21: { overall: 5, love: 4, money: 5, direction: "마무리가 성과로 이어지는 흐름", reason: "완성과 확장의 카드", action: "끝낸 일 하나를 확인하고 다음 기회를 잡아보세요.", keywords: ["완성", "성과", "확장"] },
};

const rankDelta = [0, 1, 0, 1, 1, -1, 1, 0, 1, 0, -1, 1, 1, 1, 1];
const rankDirection = ["", "새 출발", "균형", "함께 만드는 일", "기반", "작은 마찰", "도움", "기준", "속도", "버티는 힘", "짐 덜기", "새 소식", "움직임", "돌봄", "책임"];

function toScore(value: number): LuckScore {
  return Math.max(1, Math.min(5, Math.round(value))) as LuckScore;
}

function minorFortune(card: TodayTarotCard): Fortune {
  const delta = rankDelta[card.rank] ?? 0;
  const wands = card.suit === "wands";
  const cups = card.suit === "cups";
  const swords = card.suit === "swords";
  const copy: [string, string, string, string[]] = wands ? ["먼저 움직이는", "추진력과 연락", "미뤄둔 일 하나를 바로 시작해보세요.", ["행동", "열정", "속도"]]
    : cups ? ["사람 마음이 오가는", "호감과 관계", "반가운 사람에게 가볍게 먼저 말을 걸어보세요.", ["관계", "호감", "공감"]]
      : swords ? ["말과 판단을 가려야 하는", "생각과 말의 온도", "중요한 답장은 한 번 더 읽고 보내세요.", ["판단", "말", "정리"]]
        : ["현실 감각이 빛나는", "돈과 생활의 기반", "미뤄둔 실무 하나를 끝내보세요.", ["현실", "금전", "기반"]];
  return {
    overall: 3 + delta + (wands ? 1 : swords ? -1 : 0),
    love: 3 + delta + (cups ? 1 : swords ? -1 : 0),
    money: 3 + delta + (card.suit === "pentacles" ? 1 : swords ? -1 : 0),
    direction: (rankDirection[card.rank] ?? "오늘의 우선순위") + "을(를) 살리는 " + copy[0] + " 흐름",
    reason: copy[1] + "을 읽는 카드",
    action: copy[2],
    keywords: copy[3],
  };
}

function fortuneFor(card: TodayTarotCard, orientation: Orientation): Fortune {
  const fortune = card.arcana === "major" ? majorFortunes[card.rank] ?? majorFortunes[0] : minorFortune(card);
  if (orientation === "upright") return fortune;
  return { ...fortune, overall: fortune.overall - 1, love: fortune.love - 1, money: fortune.money - 1, direction: fortune.direction + "이지만 속도를 조절하는 흐름", reason: fortune.reason + "이 안쪽에서 걸리거나 늦어질 수 있는 카드", action: "바로 밀어붙이기보다 한 번 점검한 뒤 가장 작은 일부터 움직여보세요.", keywords: ["조절", ...fortune.keywords.slice(0, 2)] };
}

function tone(value: LuckScore, label: string) {
  if (value >= 4) return label + "은 좋은 편이에요.";
  if (value === 3) return label + "은 무난하게 흘러가요.";
  return label + "은 조금 아끼고 살필수록 편해져요.";
}

function cautionFor(card: TodayTarotCard, orientation: Orientation) {
  if (orientation === "reversed") return "원래 잘되던 일도 급하게 밀면 꼬일 수 있어요. 오늘은 답을 한 번 더 확인하고 움직이세요.";
  if (card.suit === "swords") return "상대의 짧은 말에 너무 큰 의미를 붙이거나, 단정적으로 답하는 건 조심하세요.";
  if (card.suit === "pentacles") return "작은 지출이 겹치기 쉬우니 필요 없는 결제는 한 번만 더 확인하세요.";
  if (card.suit === "wands") return "의욕만 앞서서 약속을 너무 많이 잡지 않는 게 좋아요.";
  if (card.suit === "cups") return "기분에 따라 바로 답하거나 기대를 크게 키우는 건 잠깐만 멈춰보세요.";
  return "카드가 보여주는 기분만 믿고 성급히 결론 내리지는 마세요.";
}

function loveText(value: LuckScore, card: TodayTarotCard) {
  if (value >= 4) return tone(value, "연애운") + " " + (card.suit === "cups" || card.rank === 6 ? "먼저 가볍게 말을 걸거나 약속을 잡기 좋은 날이에요." : "호감 표현을 너무 숨기지 않으면 분위기가 풀릴 수 있어요.");
  if (value === 3) return tone(value, "연애운") + " 상대 반응을 재단하기보다 편하게 대화하는 쪽이 더 잘 맞아요.";
  return tone(value, "연애운") + " 마음이 복잡할 땐 혼자 추측을 키우기보다 말의 뜻을 천천히 확인하세요.";
}

function moneyText(value: LuckScore, card: TodayTarotCard) {
  if (value >= 4) return tone(value, "금전운") + " " + (card.suit === "pentacles" ? "작은 실속이나 반가운 제안에 눈이 가는 날이에요." : "밀린 정산이나 실무를 처리하면 기분 좋은 결과가 남을 수 있어요.");
  if (value === 3) return tone(value, "금전운") + " 들어오는 돈보다 계획 밖 지출을 줄이는 쪽이 더 잘 맞아요.";
  return tone(value, "금전운") + " 큰 결제나 충동구매는 하루만 더 두고 보세요.";
}

/** A deterministic, card-grounded daily fortune that remains available offline. */
export function createTodayTarotInterpretation(mainCard: TodayTarotCard, mainOrientation: Orientation, clarifierCard?: TodayTarotCard, clarifierOrientation?: Orientation): TodayTarotInterpretation {
  const main = fortuneFor(mainCard, mainOrientation);
  const clarifier = clarifierCard && clarifierOrientation ? fortuneFor(clarifierCard, clarifierOrientation) : undefined;
  const overallLuck = toScore(clarifier ? main.overall * 0.7 + clarifier.overall * 0.3 : main.overall);
  const loveLuck = toScore(clarifier ? main.love * 0.7 + clarifier.love * 0.3 : main.love);
  const moneyLuck = toScore(clarifier ? main.money * 0.7 + clarifier.money * 0.3 : main.money);
  const hasClarifier = Boolean(clarifier && clarifierCard);
  const source = hasClarifier ? mainCard.nameKo + "이 큰 방향을, " + clarifierCard!.nameKo + "이 그 방향을 다루는 방법을" : mainCard.nameKo + "이 오늘의 방향을";
  const mainDetail = (mainOrientation === "upright" ? "정방향 " : "역방향 ") + mainCard.nameKo + "은 " + main.reason + "라서, 오늘은 " + main.direction + "으로 읽혀요.";
  const clarifierDetail = clarifier && clarifierCard && clarifierOrientation ? (clarifierOrientation === "upright" ? "정방향 " : "역방향 ") + clarifierCard.nameKo + "은 " + clarifier.reason + ". 그래서 메인카드의 힘을 " + clarifier.direction + "으로 보태거나 조절해줘요." : undefined;
  const goodToDo = clarifier ? clarifier.action : main.action;
  return {
    headline: tone(overallLuck, "오늘 총운") + " " + main.direction + "에 무게가 실려요.",
    lead: source + " 보여줘요. " + (hasClarifier ? "두 카드가 함께 " : "") + main.action,
    flow: hasClarifier ? mainDetail + " " + clarifierDetail : mainDetail,
    mainDetail,
    clarifierDetail,
    action: goodToDo,
    keywords: [...new Set([...(main.keywords), ...(clarifier?.keywords ?? [])])].slice(0, 3),
    overallLuck,
    loveLuck,
    moneyLuck,
    overallLuckText: tone(overallLuck, "오늘 총운") + " " + (hasClarifier ? mainCard.nameKo + "과 " + clarifierCard!.nameKo + "이 " + main.direction + "을 함께 보여줘요." : mainCard.nameKo + "이 " + main.direction + "을 보여줘요."),
    loveLuckText: loveText(loveLuck, clarifierCard ?? mainCard),
    moneyLuckText: moneyText(moneyLuck, clarifierCard ?? mainCard),
    caution: cautionFor(clarifierCard ?? mainCard, clarifierOrientation ?? mainOrientation),
    goodToDo,
    oneLiner: mainCard.nameKo + "이 말해요. 오늘은 " + main.direction + "으로 가면 운을 잡기 쉬워요.",
  };
}
