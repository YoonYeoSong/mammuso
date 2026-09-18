import type { DreamExtracted, DreamValue } from "@/lib/dream/types";

type Rule = { words: string[]; score: number; factor: string };

const symbolRules: Rule[] = [
  { words: ["돼지", "황금", "금", "보석", "돈", "지폐"], score: 18, factor: "풍요를 떠올리게 하는 상징" },
  { words: ["고양이", "강아지", "새", "아기", "꽃"], score: 9, factor: "새로운 관계나 반가운 상징" },
  { words: ["집", "문", "현관", "방"], score: 6, factor: "내 영역과 맞닿은 장면" },
  { words: ["물", "바다", "비", "강"], score: 6, factor: "흐름과 변화의 상징" },
  { words: ["뱀", "불", "자동차", "길"], score: 4, factor: "변화를 강하게 만드는 상징" },
];
const actionRules: Rule[] = [
  { words: ["안", "품", "받아", "얻", "잡", "찾", "들어"], score: 11, factor: "기회를 받아들이거나 붙잡은 행동" },
  { words: ["도망", "놓", "잃", "쫓아", "밀어"], score: -10, factor: "기회가 멀어지거나 놓친 흐름" },
  { words: ["공격", "싸움", "깨", "부서", "떨어"], score: -7, factor: "긴장감이 남는 사건" },
  { words: ["날", "웃", "도와", "선물"], score: 8, factor: "가벼워지거나 도움을 얻는 행동" },
];
const emotionRules: Rule[] = [
  { words: ["좋", "기쁨", "편안", "반가", "안심"], score: 8, factor: "편안하고 긍정적인 감정" },
  { words: ["무섭", "불안", "슬픔", "분노", "찝찝"], score: -5, factor: "조심스럽게 읽어야 할 감정" },
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
  let score = 30;
  score += scoreWords(extracted.symbols, symbolRules, factors);
  score += scoreWords(extracted.actions, actionRules, factors);
  score += scoreWords(extracted.ending ? [extracted.ending] : [], actionRules, factors);
  score += scoreWords(extracted.emotion ? [extracted.emotion] : [], emotionRules, factors);
  score += Math.min(8, extracted.notableDetails.length * 2);
  if (extracted.clarity !== "UNKNOWN") score += 4;

  const hasWelcome = extracted.actions.some((item) => /안|품|받아|잡|얻|들어/.test(item));
  const hasPositiveSymbol = extracted.symbols.some((item) => /돼지|황금|금|보석|돈|고양이|강아지|새|아기|꽃/.test(item));
  if (hasWelcome && hasPositiveSymbol) {
    score += 8;
    factors.push("상징과 행동이 같은 방향으로 이어진 조합");
  }
  if (extracted.sensitive) score = Math.max(24, score);
  score = Math.max(5, Math.min(100, score));

  const amount = Math.round((8_000 + score * score * 3_250) / 1_000) * 1_000;
  const label = extracted.sensitive
    ? "조심스럽게 들여다볼 꿈"
    : score >= 85 ? "상당히 비싼 꿈이에요."
      : score >= 64 ? "제법 값 나가는 꿈이에요."
        : score >= 40 ? "소소하게 챙겨갈 만한 꿈이에요."
          : "가볍게 지나가도 괜찮은 꿈이에요.";
  return { score, amount, label, factors: factors.slice(0, 3) };
}

export const dreamSymbolEmoji: Record<string, string> = {
  고양이: "🐱", 강아지: "🐶", 돼지: "🐷", 뱀: "🐍", 새: "🐦", 아기: "👶", 집: "🏠", 문: "🚪", 현관: "🚪", 물: "💧", 바다: "🌊", 불: "🔥", 돈: "💸", 황금: "✨", 금: "✨", 자동차: "🚗", 꽃: "🌷",
};

export function symbolEmoji(symbol: string) {
  return Object.entries(dreamSymbolEmoji).find(([word]) => symbol.includes(word))?.[1] ?? "✦";
}
