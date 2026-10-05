export const todayTarotRoutes = {
  intro: "/today-tarot",
  preparing: "/today-tarot/prepare",
  selection: "/today-tarot/select",
  reveal: "/today-tarot/reveal",
  interpreting: "/today-tarot/interpreting",
  result: "/today-tarot/result",
  detail: "/today-tarot/detail",
  advice: "/today-tarot/advice",
  complete: "/today-tarot/complete",
} as const;

export type TodayTarotStep = keyof typeof todayTarotRoutes;

export const todayTarotFlow = [
  { step: "intro", label: "오늘의 타로 소개", route: todayTarotRoutes.intro },
  { step: "preparing", label: "오늘의 흐름 준비", route: todayTarotRoutes.preparing },
  { step: "selection", label: "카드 선택", route: todayTarotRoutes.selection },
  { step: "reveal", label: "선택 카드 공개", route: todayTarotRoutes.reveal },
  { step: "interpreting", label: "해석 중", route: todayTarotRoutes.interpreting },
  { step: "result", label: "결과", route: todayTarotRoutes.result },
  { step: "detail", label: "상세 해석", route: todayTarotRoutes.detail },
  { step: "advice", label: "조언 / 공유", route: todayTarotRoutes.advice },
  { step: "complete", label: "마무리", route: todayTarotRoutes.complete },
] as const satisfies ReadonlyArray<{ step: TodayTarotStep; label: string; route: string }>;

export type TodayTarotSession = {
  id?: string;
  dateKey: string;
  step: TodayTarotStep;
  /** Generated once when the reading starts and reused for both draws. */
  deckOrder: string[];
  mainCardId?: string;
  mainOrientation?: "upright" | "reversed";
  clarifierCardId?: string | null;
  clarifierOrientation?: "upright" | "reversed" | null;
};
