export type TarotCard = {
  id: string;
  number: number;
  name: string;
  englishName: string;
  symbol: string;
  keywords: string[];
  tone: string;
};

/** Free reading uses Major Arcana only. The full deck can be added later. */
export const majorArcana: TarotCard[] = [
  ["fool", "바보", "The Fool", "○", ["시작", "가벼운 용기"], "새 길의 문턱"],
  ["magician", "마법사", "The Magician", "✦", ["가능성", "실행"], "손안의 가능성"],
  ["high-priestess", "여사제", "The High Priestess", "☾", ["직감", "숨은 마음"], "조용한 감각"],
  ["empress", "여제", "The Empress", "❀", ["풍요", "돌봄"], "잘 자라는 마음"],
  ["emperor", "황제", "The Emperor", "♜", ["기준", "안정"], "단단한 중심"],
  ["hierophant", "교황", "The Hierophant", "⌘", ["배움", "약속"], "익숙한 기준"],
  ["lovers", "연인", "The Lovers", "♡", ["선택", "연결"], "마음의 선택"],
  ["chariot", "전차", "The Chariot", "↠", ["전진", "의지"], "방향을 잡는 힘"],
  ["strength", "힘", "Strength", "∞", ["용기", "부드러운 힘"], "나를 다루는 힘"],
  ["hermit", "은둔자", "The Hermit", "◒", ["성찰", "거리"], "나만의 등불"],
  ["wheel-of-fortune", "운명의 수레바퀴", "Wheel of Fortune", "◉", ["전환", "타이밍"], "돌아가는 순간"],
  ["justice", "정의", "Justice", "⚖", ["균형", "선택의 결과"], "선명한 기준"],
  ["hanged-man", "매달린 사람", "The Hanged Man", "△", ["멈춤", "새 시선"], "잠시 뒤집어 보기"],
  ["death", "죽음", "Death", "↺", ["끝", "변화"], "다음 장으로"],
  ["temperance", "절제", "Temperance", "≈", ["조율", "회복"], "알맞은 온도"],
  ["devil", "악마", "The Devil", "⛓", ["집착", "유혹"], "놓기 어려운 마음"],
  ["tower", "탑", "The Tower", "ϟ", ["깨달음", "급전환"], "예상 밖의 틈"],
  ["star", "별", "The Star", "✧", ["희망", "회복"], "멀리서 오는 빛"],
  ["moon", "달", "The Moon", "☽", ["불안", "상상"], "아직 흐린 길"],
  ["sun", "태양", "The Sun", "☀", ["기쁨", "명료함"], "환하게 드러나는 것"],
  ["judgement", "심판", "Judgement", "♧", ["각성", "답"], "다시 듣는 목소리"],
  ["world", "세계", "The World", "◎", ["완성", "확장"], "한 바퀴의 마침표"],
].map(([id, name, englishName, symbol, keywords, tone], number) => ({ id: String(id), number, name: String(name), englishName: String(englishName), symbol: String(symbol), keywords: keywords as string[], tone: String(tone) }));

export const tarotCategories = ["연애", "돈", "일/직장", "인간관계", "전체적인 흐름", "직접 질문"] as const;
export type TarotCategory = (typeof tarotCategories)[number];

export function getTarotCards(ids: string[]) {
  return ids.map((id) => majorArcana.find((card) => card.id === id)).filter((card): card is TarotCard => Boolean(card));
}
