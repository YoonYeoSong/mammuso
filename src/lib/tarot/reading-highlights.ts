import type { DestinySpreadPosition } from "@/lib/destiny-tarot/types";
import type { ReadingHighlight, ReadingHighlightTone } from "@/components/tarot/HighlightedText";

function sentenceRange(text: string, from = 0) {
  const start = text.slice(from).search(/\S/u);
  if (start < 0) return null;
  const absoluteStart = from + start;
  const ending = text.slice(absoluteStart).search(/[.!?。！？]/u);
  const absoluteEnd = ending < 0 ? text.length : absoluteStart + ending + 1;
  return absoluteEnd > absoluteStart ? { start: absoluteStart, end: absoluteEnd } : null;
}

export function firstSentenceHighlight(text: string, tone: ReadingHighlightTone): ReadingHighlight[] {
  const range = sentenceRange(text);
  return range ? [{ ...range, tone }] : [];
}

/**
 * Extracts only text following an explicit section marker. This keeps a
 * missing or malformed AI response unstyled rather than guessing its meaning.
 */
function labelledSentenceHighlight(text: string, label: string, tone: ReadingHighlightTone): ReadingHighlight[] {
  const labelStart = text.indexOf(label);
  if (labelStart < 0) return [];
  const range = sentenceRange(text, labelStart + label.length);
  return range ? [{ ...range, tone }] : [];
}

export function actionAdviceHighlights(text: string): ReadingHighlight[] {
  return [
    ...labelledSentenceHighlight(text, "추천 행동:", "action"),
    ...labelledSentenceHighlight(text, "피할 행동:", "caution"),
  ];
}

export function fortuneHighlight(text: string, score: number): ReadingHighlight[] {
  if (score >= 4) return firstSentenceHighlight(text, "positive");
  if (score <= 2) return firstSentenceHighlight(text, "caution");
  return [];
}

/**
 * These tones come from the spread position's declared role, not from a word
 * search through AI prose. The reading text itself is never rewritten.
 */
export function positionHighlight(text: string, position: DestinySpreadPosition): ReadingHighlight[] {
  const role = `${position.label} ${position.description}`;
  if (/장애물|걸림돌|주의점|주의|피할 행동|경계|위험|부담/u.test(role)) return firstSentenceHighlight(text, "caution");
  if (/행동|조언|할 일|실행|계획|준비/u.test(role)) return firstSentenceHighlight(text, "action");
  if (/기회|강점|장점|활용할|계기|자원|연결/u.test(role)) return firstSentenceHighlight(text, "positive");
  if (/상대의 마음|나의 마음|감정/u.test(role)) return firstSentenceHighlight(text, "romance");
  if (/방향|결론|향후|앞으로|가능성/u.test(role)) return firstSentenceHighlight(text, "conclusion");
  return [];
}
