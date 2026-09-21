import type { DreamAnalysis, DreamExtracted, DreamReading, DreamTurn } from "@/lib/dream/types";

type DreamInput = { dream: string; turns: DreamTurn[] };

const symbols = ["고양이", "강아지", "돼지", "새", "아기", "꽃", "집", "문", "현관", "물", "바다", "불", "돈", "황금", "금", "자동차", "길", "뱀"];
const settings = ["집", "방", "학교", "회사", "바다", "길", "공원", "현관"];
const actions: Array<[string, string]> = [
  ["안", "품에 안았다"], ["달려", "가까이 다가왔다"], ["들어", "안으로 들어왔다"], ["받", "무언가를 받았다"],
  ["찾", "무언가를 찾았다"], ["도망", "급하게 피했다"], ["쫓", "무언가를 뒤쫓았다"], ["날", "가볍게 날아올랐다"],
];

function allDreamText({ dream, turns }: DreamInput) {
  return `${dream} ${turns.map((turn) => turn.answer).join(" ")}`;
}

function firstMatches(source: string, candidates: string[], limit: number) {
  return candidates.filter((item) => source.includes(item)).slice(0, limit);
}

export function createFallbackDreamAnalysis(input: DreamInput): DreamAnalysis {
  const source = allDreamText(input);
  const foundSymbols = firstMatches(source, symbols, 5);
  const foundActions = actions.filter(([word]) => source.includes(word)).map(([, label]) => label).slice(0, 4);
  const emotion = /좋|기쁘|편안|반갑|안심/.test(source) ? "기분이 좋았다" : /무섭|불안|슬프|화가|찝찝/.test(source) ? "조금 불안했다" : null;
  const sensitive = /죽음|사망|교통사고|피를 흘|피가 나|출혈|폭력|자해|범죄/.test(source);
  const detail = input.dream.trim().replace(/\s+/g, " ").slice(0, 70);
  const extracted: DreamExtracted = {
    symbols: foundSymbols.length ? foundSymbols : ["기억난 장면"],
    actions: foundActions.length ? foundActions : ["장면을 떠올렸다"],
    setting: firstMatches(source, settings, 3),
    ending: detail || null,
    emotion,
    fortuneDomains: foundSymbols.some((symbol) => /고양이|강아지|아기|꽃/.test(symbol)) ? ["관계와 기분"] : [],
    notableDetails: detail ? [detail] : [],
    clarity: input.dream.length >= 80 ? "선명함" : "평범함",
    sensitive,
  };

  return { status: "SUFFICIENT", extracted, missingInformation: [], followup: { question: null, options: [] } };
}

export function createFallbackDreamReading(input: DreamInput & { extracted: DreamExtracted; verdict: string }): DreamReading {
  const mainSymbol = input.extracted.symbols[0] ?? "기억난 장면";
  const mainAction = input.extracted.actions[0] ?? "장면을 떠올린 일";
  const mood = input.extracted.emotion ?? "꿈을 떠올린 지금의 기분";

  return {
    summary: `${mainSymbol}와 ${mainAction}가 남아 있는 꿈이에요.`,
    dreamType: input.verdict === "생각 정리 꿈" ? "마음 정리형 꿈" : "일상 감정형 꿈",
    typeExplanation: null,
    valueExplanation: `꿈값은 ${mainSymbol}라는 상징과 ${mainAction}라는 흐름, 그리고 ${mood}을 가볍게 점수로 바꾼 결과예요. 실제 금전적 의미는 없고, 잠에서 깬 뒤 남은 인상을 재미로 살펴보는 값이에요.`,
    interpretation: `이 꿈은 ${mainSymbol} 장면이 가장 또렷하게 남아 있어요. ${mainAction}라는 흐름은 최근 마음속에서 편하게 받아들이고 싶은 일이나 잠깐 정리해 보고 싶은 감정을 떠올리게 해요. 꿈 자체가 어떤 일을 예고하거나 답을 정해 주는 것은 아니에요. 다만 장면을 다시 말해 본 것만으로도 지금의 기분을 가볍게 알아차리는 계기는 될 수 있어요.`,
    oneLiner: `${mainSymbol} 장면이 남긴 기분을 가볍게 꺼내 본 꿈이에요.`,
    todaySuggestion: "기억에 남은 장면과 그때의 기분을 한 줄로 적어봐요.",
    futureSuggestion: "의미를 서두르기보다, 오늘 마음에 남은 감정을 편하게 살펴봐요.",
  };
}
