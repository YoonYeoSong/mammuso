import type { DreamExtracted, DreamValue } from "@/lib/dream/types";

type Rule = { words: string[]; score: number; factor: string };

const symbolRules: Rule[] = [
  { words: ["돼지", "황금", "보석", "돈", "지폐"], score: 14, factor: "풍요를 떠올리게 하는 상징" },
  { words: ["고양이", "강아지", "새", "아기", "꽃"], score: 5, factor: "반가운 상징 하나" },
  { words: ["집", "문", "현관", "방"], score: 3, factor: "내 영역과 맞닿은 장면" },
  { words: ["물", "바다", "비", "강"], score: 3, factor: "흐름을 떠올리게 하는 장면" },
  { words: ["뱀", "불", "자동차", "길"], score: 2, factor: "변화가 있는 장면" },
];
const actionRules: Rule[] = [
  { words: ["안아", "품", "받", "얻", "잡", "찾", "들어"], score: 6, factor: "무언가를 받아들이는 행동" },
  { words: ["도망", "놓", "잃", "쫓아", "밀어"], score: -6, factor: "놓치거나 피하는 흐름" },
  { words: ["공격", "싸움", "깨", "부서", "떨어"], score: -5, factor: "긴장감이 남는 장면" },
  { words: ["날", "웃", "도와", "선물"], score: 4, factor: "가벼워지거나 도움을 얻는 행동" },
];
const emotionRules: Rule[] = [
  { words: ["좋", "기쁨", "편안", "반가", "안심"], score: 4, factor: "편안하고 긍정적인 감정" },
  { words: ["무섭", "불안", "슬픔", "분노", "찝찝"], score: -3, factor: "마음에 남은 감정" },
];

function scoreWords(values: string[], rules: Rule[], factors: string[]) {
  let score = 0;
  for (const rule of rules) {
    if (values.some((value) => rule.words.some((word) => value.includes(word)))) {
      score += rule.score;
      if (!factors.includes(rule.factor)) factors.push(rule.factor);
    }
  }
  return score;
}

/** Deterministic, entertainment-only score. AI never chooses the amount. */
export function calculateDreamValue(extracted: DreamExtracted): DreamValue {
  const factors: string[] = [];
  let score = 4;
  score += scoreWords(extracted.symbols, symbolRules, factors);
  score += scoreWords(extracted.actions, actionRules, factors);
  score += scoreWords(extracted.ending ? [extracted.ending] : [], actionRules, factors);
  score += scoreWords(extracted.emotion ? [extracted.emotion] : [], emotionRules, factors);
  score += Math.min(4, extracted.notableDetails.length);
  if (["상징이 강함", "반복됨", "강하게 기억남"].includes(extracted.clarity)) score += 2;

  const hasWelcome = extracted.actions.some((item) => /안아|품|받|잡|얻|찾|들어/.test(item));
  const hasPositiveSymbol = extracted.symbols.some((item) => /돼지|황금|금|보석|돈|고양이|강아지|새|아기|꽃/.test(item));
  if (hasWelcome && hasPositiveSymbol) {
    score += 5;
    factors.push("상징과 행동이 같은 방향으로 이어진 조합");
  }
  const hasUneasySignal = [...extracted.actions, extracted.ending ?? "", extracted.emotion ?? ""].some((item) => /도망|놓|잃|쫓아|밀어|공격|싸움|깨|부서|떨어|무섭|불안|슬픔|분노|찝찝/.test(item));
  if (!factors.length) factors.push("잠결 알고리즘이 자동재생한 장면");
  if (extracted.sensitive) score = Math.max(8, score);
  score = Math.max(2, Math.min(70, score));

  const amount = Math.max(2_000, Math.round((1_000 + score * score * 120) / 1_000) * 1_000);
  const verdict = extracted.sensitive
    ? "조심스럽게 넘겨볼 꿈"
    : score >= 32 && hasWelcome && hasPositiveSymbol ? "길몽 기질"
      : score >= 21 && hasPositiveSymbol ? "소소한 좋은 꿈"
        : hasUneasySignal ? "생각 정리 꿈"
          : score <= 10 ? "해몽 패스 꿈"
            : "잠결 알고리즘 꿈";
  const label = extracted.sensitive
    ? "값보다 마음을 먼저 챙겨줄 꿈이에요."
    : verdict === "길몽 기질" ? "은근히 값이 붙는 꿈이에요."
      : verdict === "소소한 좋은 꿈" ? "작지만 기분 좋은 값이에요."
        : verdict === "생각 정리 꿈" ? "가격보다 마음의 잔상이 남는 꿈이에요."
          : verdict === "해몽 패스 꿈" ? "뇌가 잠깐 자동재생한 클립이에요."
            : "뇌가 내부 테스트를 한 번 돌린 것 같아요.";
  const tier = extracted.sensitive
    ? "조용히 넘겨보기급"
    : score <= 8 ? "알람 5분 더급"
      : score <= 16 ? "간식 플렉스급"
        : score <= 27 ? "야식 업그레이드급"
          : score <= 40 ? "통장 미소급"
            : "갑자기 보물상자급";
  return { score, amount, verdict, tier, label, factors: factors.slice(0, 3) };
}

export const dreamSymbolEmoji: Record<string, string> = {
  고양이: "🐱", 강아지: "🐶", 돼지: "🐷", 뱀: "🐍", 새: "🐦", 아기: "👶", 집: "🏠", 문: "🚪", 현관: "🚪", 물: "💧", 바다: "🌊", 불: "🔥", 돈: "💸", 황금: "✨", 금: "✨", 자동차: "🚗", 꽃: "🌷",
};

export function symbolEmoji(symbol: string) {
  return Object.entries(dreamSymbolEmoji).find(([word]) => symbol.includes(word))?.[1] ?? "✦";
}
