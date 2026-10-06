import type { TodayTarotCard } from "./deck";

type Orientation = "upright" | "reversed";

export type TodayTarotInterpretation = {
  headline: string;
  lead: string;
  flow: string;
  mainDetail: string;
  clarifierDetail?: string;
  action: string;
  keywords: string[];
};

const majorThemes: Record<number, { direction: string; reason: string; action: string; keywords: string[] }> = {
  0: { direction: "낯선 일을 너무 무겁게 재지 말고 작은 시작으로 열어보는", reason: "새 출발 앞에서 필요한 가벼운 용기", action: "망설이던 일의 첫 단계만 정해 바로 시작해보세요.", keywords: ["시작", "가벼운 용기", "호기심"] },
  1: { direction: "이미 가진 도구를 꺼내 실제로 움직이는", reason: "생각을 실행으로 바꾸는 힘", action: "오늘 쓸 수 있는 시간·사람·도구를 하나씩 적어 행동으로 옮겨보세요.", keywords: ["실행", "가능성", "집중"] },
  2: { direction: "바깥의 답보다 내 감각을 잠시 들어보는", reason: "아직 드러나지 않은 마음과 정보", action: "바로 답하지 말고, 마음에 걸린 이유를 한 문장으로 적어보세요.", keywords: ["직감", "관찰", "여백"] },
  3: { direction: "이미 자라는 것을 돌보고 즐기는", reason: "풍요와 돌봄이 필요한 흐름", action: "나를 편하게 만드는 한 가지를 먼저 챙기고, 고마운 마음도 표현해보세요.", keywords: ["돌봄", "풍요", "여유"] },
  4: { direction: "기준을 세워 흔들리는 일을 정리하는", reason: "안정과 구조가 필요한 흐름", action: "오늘 꼭 지킬 기준 하나를 정하고, 그 기준에 맞지 않는 일은 미뤄보세요.", keywords: ["기준", "안정", "정리"] },
  5: { direction: "익숙한 기준에서 배울 점을 골라 적용하는", reason: "약속과 배움이 주는 안내", action: "믿을 만한 조언 하나를 참고하되, 내 상황에 맞는 부분만 골라보세요.", keywords: ["배움", "약속", "기준"] },
  6: { direction: "마음이 향하는 선택을 솔직하게 확인하는", reason: "관계와 선택의 진짜 기준", action: "해야 해서 하는 일과 정말 원하는 일을 구분해 한 줄씩 적어보세요.", keywords: ["선택", "연결", "솔직함"] },
  7: { direction: "흩어진 힘을 한 방향에 모아 전진하는", reason: "방향을 잡는 의지", action: "오늘의 우선순위 하나를 골라, 다른 할 일보다 먼저 끝내보세요.", keywords: ["전진", "의지", "방향"] },
  8: { direction: "힘으로 밀어붙이기보다 부드럽게 나를 다루는", reason: "차분한 용기가 필요한 흐름", action: "급한 반응 대신 한 번 숨을 고르고, 가장 다정한 방식으로 답해보세요.", keywords: ["용기", "인내", "부드러움"] },
  9: { direction: "사람들 속도보다 내 생각을 정리하는", reason: "혼자 비춰볼 시간이 주는 선명함", action: "알림을 잠시 끄고, 지금 판단에 필요한 정보만 골라보세요.", keywords: ["성찰", "거리", "선명함"] },
  10: { direction: "변화의 신호를 붙잡기보다 타이밍을 읽는", reason: "움직이는 조건과 전환점", action: "고정된 계획 하나를 유연하게 바꿀 여지를 남겨두세요.", keywords: ["전환", "타이밍", "유연함"] },
  11: { direction: "감정보다 기준을 먼저 세워 판단하는", reason: "균형 잡힌 선택이 필요한 흐름", action: "결정 전 장점과 부담을 같은 수만큼 적어 균형을 확인해보세요.", keywords: ["균형", "판단", "기준"] },
  12: { direction: "서두른 결론을 잠시 멈추고 다른 각도에서 보는", reason: "멈춤이 만들어내는 새 시선", action: "지금 답이 안 나는 일은 하루만 보류하고, 반대 입장에서 한 번 적어보세요.", keywords: ["멈춤", "새 시선", "여백"] },
  13: { direction: "끝난 일에 매달리기보다 다음 단계로 정리하는", reason: "변화와 마무리가 필요한 흐름", action: "더는 도움이 되지 않는 습관 하나를 오늘만큼은 내려놓아 보세요.", keywords: ["변화", "정리", "다음 단계"] },
  14: { direction: "한쪽으로 치우치지 않고 속도를 조율하는", reason: "알맞은 온도를 찾는 흐름", action: "과한 계획 하나를 절반으로 줄여, 꾸준히 할 수 있게 조정해보세요.", keywords: ["조율", "회복", "균형"] },
  15: { direction: "나를 묶는 습관을 알아차리고 거리를 두는", reason: "집착과 유혹을 분별하는 흐름", action: "끌리지만 뒤가 불편한 선택 하나에는 잠시 답을 미뤄보세요.", keywords: ["거리두기", "선택", "해방"] },
  16: { direction: "예상과 달라진 일을 외면하지 않고 다시 세우는", reason: "깨달음과 급전환이 주는 틈", action: "계획이 틀어진 이유를 탓하기보다, 지금 가능한 대안을 하나 만들어보세요.", keywords: ["재정비", "깨달음", "전환"] },
  17: { direction: "작더라도 회복되는 쪽에 마음을 두는", reason: "희망과 회복의 흐름", action: "오늘 잘된 일 하나를 기록하고, 내일 이어갈 작은 약속을 정해보세요.", keywords: ["희망", "회복", "신뢰"] },
  18: { direction: "불안이 만든 상상과 사실을 구분하는", reason: "아직 흐린 정보와 감정", action: "걱정되는 생각에는 사실인지 추측인지 표시해보세요.", keywords: ["점검", "직감", "차분함"] },
  19: { direction: "숨기기보다 기쁜 마음을 자연스럽게 드러내는", reason: "명료함과 활력이 살아나는 흐름", action: "고마움이나 반가움을 먼저 한 번 표현해보세요.", keywords: ["기쁨", "명료함", "표현"] },
  20: { direction: "미뤄둔 목소리에 답하고 필요한 결정을 정리하는", reason: "다시 듣게 되는 중요한 신호", action: "계속 미뤄둔 연락이나 결정 하나에 오늘 답을 정해보세요.", keywords: ["각성", "결정", "응답"] },
  21: { direction: "마무리한 일을 인정하고 다음 장을 준비하는", reason: "완성과 확장이 만나는 흐름", action: "끝낸 일 하나를 체크하고, 그 다음에 열고 싶은 목표를 적어보세요.", keywords: ["완성", "확장", "마무리"] },
};

const rankDirections = ["새 가능성을 조심스럽게 열어보는", "두 선택지의 균형을 살피는", "함께 만든 흐름을 키우는", "지금의 기반을 단단히 하는", "작은 마찰의 핵심을 가려내는", "도움과 주고받음을 살피는", "내 기준을 지키는", "속도와 소식을 활용하는", "끝까지 버틸 힘을 보살피는", "과한 짐을 덜어내는", "호기심으로 배우는", "움직이며 답을 찾는", "차분하게 돌보고 이끄는", "책임 있게 방향을 잡는"];

function cardTheme(card: TodayTarotCard) {
  if (card.arcana === "major") return majorThemes[card.rank] ?? majorThemes[0];
  const suit = card.suit === "wands" ? { reason: "추진력과 행동의 에너지", action: "생각만 하던 일의 첫 동작을 작게 시작해보세요.", keywords: ["행동", "열정", "추진"] }
    : card.suit === "cups" ? { reason: "마음과 관계의 신호", action: "내 마음을 한 문장으로 정리해 필요한 사람에게 부드럽게 전해보세요.", keywords: ["감정", "관계", "공감"] }
      : card.suit === "swords" ? { reason: "생각과 판단을 정리할 필요", action: "복잡한 생각을 적어 사실과 해석을 나눠보세요.", keywords: ["판단", "정리", "명료함"] }
        : { reason: "현실적인 조건과 꾸준함", action: "오늘 할 수 있는 현실적인 한 단계를 끝내보세요.", keywords: ["현실", "꾸준함", "기반"] };
  return { direction: rankDirections[card.rank - 1] ?? "지금의 우선순위를 정리하는", ...suit };
}

function withOrientation(theme: ReturnType<typeof cardTheme>, orientation: Orientation) {
  if (orientation === "upright") return theme;
  return {
    ...theme,
    direction: `${theme.keywords[0]}의 힘을 밖으로 서두르기보다 천천히 조정하는`,
    reason: "에너지를 바깥 행동보다 내면에서 조절할 필요가 있어요.",
    action: "바로 밀어붙이기보다, 지금 막히는 이유를 한 번 점검한 뒤 가장 작은 단계부터 다시 해보세요.",
    keywords: ["조정", ...theme.keywords.slice(0, 2)],
  };
}

/** A local, card-grounded reading keeps the daily result specific even offline. */
export function createTodayTarotInterpretation(mainCard: TodayTarotCard, mainOrientation: Orientation, clarifierCard?: TodayTarotCard, clarifierOrientation?: Orientation): TodayTarotInterpretation {
  const main = withOrientation(cardTheme(mainCard), mainOrientation);
  const clarifier = clarifierCard && clarifierOrientation ? withOrientation(cardTheme(clarifierCard), clarifierOrientation) : undefined;
  const hasClarifier = Boolean(clarifier && clarifierCard);
  const headline = hasClarifier
    ? `오늘은 ${main.direction} 쪽에 무게를 두되, ${clarifierCard!.nameKo}의 힌트로 속도를 조절해보세요.`
    : `오늘은 ${main.direction} 쪽에 무게를 두는 하루예요.`;
  const mainDetail = mainOrientation === "upright"
    ? `정방향 ${mainCard.nameKo}은 ${main.reason}을 보여줘요. 그래서 오늘의 중심은 ${main.direction} 쪽에 있습니다.`
    : `역방향 ${mainCard.nameKo}은 ${main.reason} 그래서 오늘의 중심은 ${main.direction} 쪽에 있습니다.`;
  const clarifierDetail = clarifier && clarifierCard && clarifierOrientation
    ? clarifierOrientation === "upright"
      ? `정방향 ${clarifierCard.nameKo}은 ${clarifier.reason}을 보태요. 메인카드의 방향을 무작정 밀기보다 ${clarifier.direction} 감각을 함께 써보세요.`
      : `역방향 ${clarifierCard.nameKo}은 ${clarifier.reason} 메인카드의 방향을 무작정 밀기보다 ${clarifier.direction} 감각을 함께 써보세요.`
    : undefined;
  return {
    headline,
    lead: hasClarifier ? `${mainCard.nameKo}이 오늘의 큰 방향을, ${clarifierCard!.nameKo}이 그 방향을 다루는 방식을 보여줍니다.` : `${mainCard.nameKo}이 오늘의 큰 방향을 또렷하게 보여줍니다.`,
    flow: hasClarifier ? `${mainDetail} ${clarifierDetail}` : mainDetail,
    mainDetail,
    clarifierDetail,
    action: clarifier ? clarifier.action : main.action,
    keywords: [...new Set([...(main.keywords), ...(clarifier?.keywords ?? [])])].slice(0, 3),
  };
}
