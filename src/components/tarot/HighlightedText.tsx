import type { ReactNode } from "react";

export const readingHighlightTones = ["conclusion", "positive", "romance", "caution", "action"] as const;
export type ReadingHighlightTone = (typeof readingHighlightTones)[number];

export type ReadingHighlight = {
  start: number;
  end: number;
  tone: ReadingHighlightTone;
};

type Props = {
  text: string;
  highlights?: readonly ReadingHighlight[];
  className?: string;
};

function isTone(value: unknown): value is ReadingHighlightTone {
  return typeof value === "string" && (readingHighlightTones as readonly string[]).includes(value);
}

/**
 * Only ranges that fit the original text exactly are rendered. Invalid or
 * overlapping metadata intentionally falls back to the unstyled text.
 */
function validHighlights(text: string, highlights: readonly ReadingHighlight[] | undefined) {
  if (!highlights?.length) return [];

  const valid: ReadingHighlight[] = [];
  for (const highlight of highlights) {
    if (!Number.isInteger(highlight.start) || !Number.isInteger(highlight.end) || !isTone(highlight.tone)) continue;
    if (highlight.start < 0 || highlight.end > text.length || highlight.start >= highlight.end) continue;
    if (valid.some((item) => highlight.start < item.end && highlight.end > item.start)) continue;
    valid.push(highlight);
  }
  return valid.sort((left, right) => left.start - right.start);
}

export function HighlightedText({ text, highlights, className }: Props) {
  const ranges = validHighlights(text, highlights);
  if (!ranges.length) return <>{text}</>;

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (cursor < range.start) parts.push(text.slice(cursor, range.start));
    parts.push(<span className={`${className ?? "reading-highlight"} ${className ?? "reading-highlight"}--${range.tone}`} key={`${range.start}-${range.end}-${range.tone}`}>{text.slice(range.start, range.end)}</span>);
    cursor = range.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}
