import type { DestinyCardCount, DestinyReadingType as CoreDestinyReadingType, DestinySpread, DestinySpreadPosition, DestinySpreadTemplate } from "./types";

export const destinyReadingTypes = ["love", "money", "choice", "career", "reunion", "general"] as const;
export type DestinyReadingType = CoreDestinyReadingType;

type SpreadLines = Record<DestinyCardCount, ReadonlyArray<readonly [string, string]>>;
type SpreadFamily = { id: string; test: RegExp; template: DestinySpreadTemplate; lines: SpreadLines };

function family(id: string, test: RegExp, template: DestinySpreadTemplate, three: SpreadLines[3], five: SpreadLines[5], ten: SpreadLines[10]): SpreadFamily {
  return { id, test, template, lines: { 3: three, 5: five, 10: ten } };
}

const profiles = {
  love: {
    displayName: "연애타로", description: "사랑과 인연의 흐름을 읽어요", keywords: "새로운 인연 · 썸 · 연애 · 상대의 마음",
    guideName: "인연 안내자", greeting: "안녕하세요 :) 인연 안내자예요.\n오늘은 어떤 사랑 이야기가 궁금해서 찾아오셨어요?",
    chatGuide: "사랑과 인연에서 무엇을 알고 싶은지, 필요한 만큼만 함께 정리할게요.",
    topicInstruction: "연애, 썸, 새 인연, 상대의 마음, 관계의 변화에 집중합니다. 관계를 캐묻거나 개인정보를 묻지 마세요.",
    interpretationFocus: "감정, 인연, 관계 변화와 상대가 보일 흐름에 초점을 둡니다.",
    families: [
      family("new-connection", /새(로운)?\s*(사람|인연)|만날|연애.*시작|썸/, "relationship",
        [["나의 연애 흐름", "지금 내가 품고 있는 사랑의 흐름"], ["새 인연의 기운", "새로운 만남이 들어오는 움직임"], ["인연을 맞는 조언", "사랑을 자연스럽게 맞이하기 위한 태도"]],
        [["나의 연애 흐름", "지금 나의 사랑과 인연의 상태"], ["새 인연의 흐름", "새로운 사람이 다가올 수 있는 움직임"], ["만남의 계기", "인연이 연결될 수 있는 장면이나 계기"], ["관계의 발전", "만남이 이어질 때 보이는 관계의 방향"], ["사랑을 잡는 조언", "인연을 편안하게 맞이하기 위한 태도"]],
        [["나의 연애 흐름", "현재 사랑을 대하는 나의 상태"], ["지난 인연의 영향", "새 만남에 남아 있는 과거의 흔적"], ["새 인연의 기운", "다가오는 만남의 가능성이 움직이는 방식"], ["만남의 계기", "연결을 만들 수 있는 현실적 장면"], ["나의 매력", "상대에게 자연스럽게 전해지는 나의 강점"], ["열린 마음", "인연을 받아들이며 조절할 부분"], ["관계의 시작", "만남이 관계로 넘어갈 때의 흐름"], ["걸림돌", "인연을 어렵게 만들 수 있는 요소"], ["사랑의 방향", "앞으로 관계에 실리는 흐름"], ["인연을 위한 조언", "지금 사랑에 필요한 가장 중요한 태도"]]),
      family("their-feelings", /어떻게 생각|속마음|마음|감정|상대/, "relationship",
        [["현재 관계", "두 사람 사이에 놓인 지금의 분위기"], ["상대의 감정", "상대가 관계에서 느끼는 마음"], ["관계의 흐름", "상대가 보일 수 있는 다음 움직임"]],
        [["현재 관계", "두 사람 사이의 지금 흐름"], ["상대의 감정", "상대가 관계에서 느끼는 마음"], ["드러나지 않은 마음", "상대가 쉽게 표현하지 않는 부분"], ["상대의 다음 행동", "앞으로 보일 수 있는 태도나 움직임"], ["관계의 향후 흐름", "두 사람 관계가 향하는 방향"]],
        [["현재 관계", "두 사람 사이의 현재 분위기"], ["나의 마음", "내가 관계에서 바라는 것"], ["상대의 감정", "상대가 관계에서 느끼는 감정"], ["숨은 마음", "상대가 드러내지 않는 속내"], ["관계의 매력", "두 사람을 이어 주는 요소"], ["거리감", "관계를 조심스럽게 만드는 지점"], ["상대의 행동", "상대가 보일 다음 태도"], ["외부 영향", "관계에 작용하는 주변의 흐름"], ["관계의 방향", "앞으로 두 사람에게 실리는 흐름"], ["관계를 위한 조언", "지금 관계에서 가장 필요한 태도"]]),
    ],
  },
  money: {
    displayName: "재물타로", description: "돈과 재물의 흐름을 살펴봐요", keywords: "재물운 · 금전 흐름 · 기회 · 지출",
    guideName: "황금별 안내자", greeting: "안녕하세요 :) 재물의 흐름을 함께 살펴볼게요.\n오늘은 어떤 금전운이 가장 궁금하신가요?",
    chatGuide: "돈의 흐름에서 카드로 확인하고 싶은 방향을 빠르게 정리할게요.",
    topicInstruction: "재물 흐름, 기회, 지출과 돈의 움직임을 다룹니다. 소득·저축·부채·투자 같은 민감한 현실 정보를 묻지 마세요.",
    interpretationFocus: "재물 흐름, 기회, 손실 위험과 돈의 움직임에 초점을 둡니다.",
    families: [family("money-flow", /.*/, "linear",
      [["현재 재물 흐름", "지금 돈의 움직임에서 가장 중요한 기운"], ["들어오는 기회", "재물 흐름을 바꿀 수 있는 기회"], ["재물을 잡는 조언", "돈의 흐름을 다루는 데 필요한 태도"]],
      [["현재 재물 흐름", "지금 돈의 움직임과 상태"], ["들어오는 기회", "재물과 연결될 수 있는 기회"], ["새는 지점", "돈의 흐름을 막거나 흔드는 요소"], ["앞으로의 금전 흐름", "이후 재물에 실리는 움직임"], ["재물을 잡는 포인트", "지금 주의 깊게 잡아야 할 방향"]],
      [["현재 재물 흐름", "지금 돈의 움직임"], ["흐름의 배경", "재물 상태를 만든 최근의 영향"], ["들어오는 기회", "금전 기회가 열리는 방식"], ["나의 태도", "돈을 대하는 현재의 감각"], ["새는 지점", "재물 흐름을 막는 요소"], ["숨은 자원", "아직 충분히 활용하지 않은 가능성"], ["지출의 변수", "돈의 움직임을 바꿀 수 있는 조건"], ["기회를 잡는 방식", "재물 기회에 대응하는 태도"], ["앞으로의 금전 흐름", "다음 흐름에 실리는 방향"], ["재물의 조언", "지금 돈에 관해 필요한 기준"]])],
  },
  choice: {
    displayName: "선택타로", description: "고민되는 선택의 흐름을 비교해요", keywords: "A vs B · 할까 말까 · 결정 · 방향",
    guideName: "갈림길 안내자", greeting: "안녕하세요 :) 선택의 길을 함께 살펴볼게요.\n지금 어떤 두 선택 사이에서 고민하고 계신가요?",
    chatGuide: "두 길 가운데 카드로 비교하고 싶은 선택을 선명하게 정리할게요.",
    topicInstruction: "A와 B, 할지 말지처럼 선택의 비교에 집중합니다. 조건을 길게 조사하거나 현실적 의사결정을 대신하지 마세요.",
    interpretationFocus: "A와 B의 차이, 장단점과 어느 방향에 더 무게가 실리는지에 초점을 둡니다.",
    families: [family("compare", /.*/, "choice",
      [["현재 선택의 핵심", "지금 갈림길에서 가장 중요한 기준"], ["A 선택의 흐름", "첫 번째 선택이 만들어갈 움직임"], ["B 선택의 흐름", "다른 선택이 만들어갈 움직임"]],
      [["현재 상황", "지금 선택을 앞둔 핵심 상태"], ["A 선택의 흐름", "첫 번째 선택이 이어갈 가능성"], ["B 선택의 흐름", "두 번째 선택이 이어갈 가능성"], ["중요한 변수", "두 길의 판단을 바꿀 수 있는 조건"], ["더 무게가 실리는 방향", "지금 카드가 우선으로 비추는 선택의 방향"]],
      [["현재 상황", "선택을 앞둔 지금의 상태"], ["선택의 배경", "갈림길이 생긴 흐름"], ["A의 장점", "A 선택이 살릴 수 있는 강점"], ["A의 주의점", "A 선택에서 살펴야 할 부담"], ["B의 장점", "B 선택이 살릴 수 있는 강점"], ["B의 주의점", "B 선택에서 살펴야 할 부담"], ["나의 우선순위", "결정에서 놓치지 말아야 할 기준"], ["외부 변수", "선택에 작용하는 현실 조건"], ["더 무게가 실리는 방향", "현재 카드가 비추는 우선 방향"], ["결정을 위한 조언", "선택을 실행하기 전 필요한 태도"]])],
  },
  career: {
    displayName: "직장·진로타로", description: "일과 앞으로의 방향을 살펴봐요", keywords: "취업 · 이직 · 직장 · 진로",
    guideName: "나침반 안내자", greeting: "안녕하세요 :)\n일과 진로에 관한 어떤 고민을 가지고 오셨나요?",
    chatGuide: "일과 진로에서 카드로 보고 싶은 방향을 가볍게 정리할게요.",
    topicInstruction: "직장, 취업, 이직, 진로와 일의 방향에 집중합니다. 연봉·회사 정보·근로조건 등 민감한 현실 정보를 묻지 마세요.",
    interpretationFocus: "직장, 취업, 이직, 진로와 앞으로의 방향에 초점을 둡니다.",
    families: [family("career-flow", /.*/, "cross",
      [["현재 일의 흐름", "지금 일과 진로에서 가장 중요한 상태"], ["움직임의 기회", "변화나 도약으로 이어질 수 있는 기회"], ["다음 방향", "일과 진로에서 카드가 비추는 방향"]],
      [["현재 일의 흐름", "직장과 진로의 현재 상태"], ["변화의 기회", "이직·취업·성장으로 이어질 수 있는 기회"], ["걸림돌", "다음 방향을 어렵게 만드는 요소"], ["움직일 때의 흐름", "변화를 택할 때 보이는 전개"], ["진로의 조언", "지금 일에서 필요한 판단 기준"]],
      [["현재 일의 흐름", "지금 직장과 진로의 상태"], ["지금까지의 영향", "현재 방향을 만든 경험과 환경"], ["나의 강점", "일에서 드러나는 능력과 자원"], ["변화의 기회", "이직·취업·성장으로 이어질 수 있는 기회"], ["걸림돌", "움직임을 어렵게 만드는 지점"], ["새 환경의 흐름", "변화한 자리에서 보이는 가능성"], ["남는 선택의 흐름", "현재 자리에 머물 때 보이는 움직임"], ["중요한 조건", "결정 전에 확인해야 할 현실 기준"], ["진로의 방향", "앞으로 더 무게가 실리는 길"], ["움직임의 조언", "다음 행동을 위한 태도"]])],
  },
  reunion: {
    displayName: "재회타로", description: "다시 이어질 인연을 살펴봐요", keywords: "전 연인 · 속마음 · 연락 · 재회 가능성",
    guideName: "인연의 달 안내자", greeting: "안녕하세요 :)\n다시 이어지고 싶은 인연에 대해 편하게 이야기해 주세요.",
    chatGuide: "다시 이어지고 싶은 관계에서 카드로 확인할 흐름을 차분히 정리할게요.",
    topicInstruction: "헤어진 인연, 연락, 재회 가능성과 관계의 흐름을 다룹니다. 상대를 추적하거나 과도한 사연을 묻지 마세요.",
    interpretationFocus: "관계 단절 상태, 상대 흐름, 다시 움직일 가능성, 장애물과 관계의 방향에 초점을 둡니다.",
    families: [family("reunion-flow", /.*/, "relationship",
      [["현재 관계의 거리", "지금 두 사람 사이에 놓인 단절의 상태"], ["상대의 흐름", "상대가 관계를 대하는 현재의 움직임"], ["다시 이어질 방향", "관계가 움직일 수 있는 가능성과 태도"]],
      [["현재 관계의 거리", "두 사람 사이의 단절과 현재 분위기"], ["상대의 흐름", "상대가 관계에서 보이는 마음과 태도"], ["다시 움직일 계기", "관계가 다시 이어질 수 있는 조건"], ["재회의 장애물", "관계를 어렵게 만드는 지점"], ["관계의 향후 방향", "재회에 관해 카드가 비추는 흐름"]],
      [["현재 관계의 거리", "두 사람 사이의 지금 상태"], ["헤어짐의 영향", "단절 뒤에도 남아 있는 흐름"], ["나의 마음", "내가 관계에서 바라는 것"], ["상대의 흐름", "상대가 관계를 대하는 현재 태도"], ["남아 있는 연결", "두 사람을 다시 잇는 요소"], ["재회의 장애물", "다시 움직이기 어려운 지점"], ["연락의 흐름", "관계에 변화가 생길 수 있는 움직임"], ["필요한 거리", "지금 관계에서 지켜야 할 균형"], ["관계의 향후 방향", "앞으로 두 사람에게 실리는 흐름"], ["인연을 위한 조언", "관계를 대할 때 필요한 태도"]])],
  },
  general: {
    displayName: "운명타로", description: "어떤 고민이든 깊게 들여다봐요", keywords: "고민 · 미래 · 관계 · 종합 리딩",
    guideName: "달빛 안내자", greeting: "안녕하세요 :) 달빛 안내자예요.\n오늘은 어떤 게 궁금해서 찾아오셨어요?\n편하게 말씀해 주세요.",
    chatGuide: "천천히 이야기해 주세요. 필요한 만큼만 함께 질문을 정리할게요.",
    topicInstruction: "사용자가 말한 고민의 핵심을 빠르게 한 문장으로 정리합니다. 불필요한 개인정보나 현실 상담 질문은 하지 마세요.",
    interpretationFocus: "현재 고민의 핵심, 변화의 흐름과 다음 선택에 초점을 둡니다.",
    families: [family("general-flow", /.*/, "cross",
      [["현재 상황", "지금 질문을 둘러싼 가장 중요한 흐름"], ["움직이는 흐름", "이 고민이 향하고 있는 방향"], ["조언", "지금 마음에 담아둘 태도와 방향"]],
      [["현재 상황", "지금 질문을 둘러싼 핵심 상태"], ["중요한 영향", "결정에 힘을 보태거나 흔드는 요소"], ["선택의 흐름", "지금 선택이 만들어갈 움직임"], ["앞으로의 방향", "한 걸음 더 살펴볼 수 있는 방향"], ["조언", "지금 나에게 필요한 태도와 시선"]],
      [["현재 상황", "지금 질문의 중심에 있는 상태"], ["배경", "이 고민이 여기까지 오게 된 흐름"], ["내면", "내 마음속에서 작동하는 바람과 두려움"], ["외부 영향", "주변 환경과 관계가 주는 영향"], ["장애물", "선택을 어렵게 만드는 지점"], ["가능성", "아직 충분히 보이지 않은 가능성"], ["변화", "움직이기 시작할 수 있는 부분"], ["중요한 변수", "결정에 영향을 주는 핵심 조건"], ["앞으로의 흐름", "현재 선택이 이어갈 수 있는 흐름"], ["조언", "지금 나에게 필요한 방향과 태도"]])],
  },
} as const;

export type DestinyReadingProfile = (typeof profiles)[DestinyReadingType];

export function isDestinyReadingType(value: unknown): value is DestinyReadingType {
  return typeof value === "string" && destinyReadingTypes.includes(value as DestinyReadingType);
}

export function getDestinyReadingProfile(readingType: unknown = "general"): DestinyReadingProfile {
  return profiles[isDestinyReadingType(readingType) ? readingType : "general"];
}

export function createProfileDestinySpread(readingType: DestinyReadingType, finalQuestion: string, cardCount: DestinyCardCount): DestinySpread {
  const profile = getDestinyReadingProfile(readingType);
  const family = profile.families.find((candidate) => candidate.test.test(finalQuestion)) ?? profile.families[0];
  return {
    template: family.template,
    positions: family.lines[cardCount].map(([label, description], index): DestinySpreadPosition => ({ id: `position-${index + 1}`, order: index + 1, label, description })),
  };
}

export function createProfileCardCountRecommendation(readingType: DestinyReadingType, finalQuestion: string): { recommendedCardCount: DestinyCardCount; reason: string } {
  const profile = getDestinyReadingProfile(readingType);
  const veryDeepQuestion = /10장|깊게|여러\s*(관점|가지|흐름)|전체.*깊/.test(finalQuestion);
  const deepQuestion = /A\s*(vs|와|과|또는)|B\s*(vs|와|과|또는)|비교|남는|이직|재회|상대.*(마음|생각)|속마음|올해|새.*만날/.test(finalQuestion);
  const recommendedCardCount: DestinyCardCount = veryDeepQuestion ? 10 : deepQuestion ? 5 : 3;
  return {
    recommendedCardCount,
    reason: recommendedCardCount === 10
      ? `${profile.displayName}의 여러 흐름을 충분히 비교할 수 있도록 10장을 추천해요.`
      : recommendedCardCount === 5
      ? `${profile.displayName}의 흐름과 여러 변수를 함께 보기 좋게 5장을 추천해요.`
      : `${profile.displayName}의 핵심 흐름을 빠르게 확인하기 좋게 3장을 추천해요.`,
  };
}
