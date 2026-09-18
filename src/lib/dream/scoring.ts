export const dreamSymbolEmoji: Record<string, string> = {
  고양이: "🐱", 강아지: "🐶", 돼지: "🐷", 뱀: "🐍", 새: "🐦", 아기: "👶", 집: "🏠", 문: "🚪", 현관: "🚪", 물: "💧", 바다: "🌊", 불: "🔥", 돈: "💸", 황금: "✨", 금: "✨", 자동차: "🚗", 꽃: "🌷",
};

export function symbolEmoji(symbol: string) {
  return Object.entries(dreamSymbolEmoji).find(([word]) => symbol.includes(word))?.[1] ?? "✦";
}
