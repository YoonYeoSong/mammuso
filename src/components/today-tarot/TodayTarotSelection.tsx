"use client";

import { useEffect, useState } from "react";
import { TodayTarotHeader } from "./TodayTarotHeader";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { todayTarotRoutes, type TodayTarotSession } from "@/lib/today-tarot/flow";

export function TodayTarotSelection() {
  const [session, setSession] = useState<TodayTarotSession | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(TODAY_TAROT_SESSION_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as TodayTarotSession;
      if (parsed.shuffledCardIds.length === 78) setSession(parsed);
    } catch {
      // A corrupt or stale browser session should be prepared again instead.
    }
  }, []);

  function chooseCard(cardId: string) {
    setSelectedCardId(cardId);
    if (!session) return;
    window.sessionStorage.setItem(TODAY_TAROT_SESSION_KEY, JSON.stringify({ ...session, selectedCardId: cardId }));
  }

  if (!session) return <main className="today-tarot-page today-tarot-selection-page">
    <div className="today-tarot-app-surface">
      <TodayTarotHeader backHref={todayTarotRoutes.preparing} />
      <section className="today-tarot-selection-empty"><h2>카드를 준비하고 있어요.</h2><a href={todayTarotRoutes.preparing}>준비 화면으로 돌아가기</a></section>
    </div>
  </main>;

  return <main className="today-tarot-page today-tarot-selection-page">
    <div className="today-tarot-app-surface">
      <TodayTarotHeader backHref={todayTarotRoutes.intro} />
      <section className="today-tarot-selection" aria-labelledby="today-tarot-selection-title">
        <p>오늘의 타로</p>
        <h2 id="today-tarot-selection-title">마음이 이끄는 카드 한 장을<br />직접 골라주세요.</h2>
        <div className="today-tarot-card-grid" aria-label="섞인 78장 카드">
          {session.shuffledCardIds.map((cardId, index) => <button
            key={cardId}
            type="button"
            className={`today-tarot-card-choice ${selectedCardId === cardId ? "is-selected" : ""}`}
            aria-label={`카드 ${index + 1}번 선택`}
            aria-pressed={selectedCardId === cardId}
            onClick={() => chooseCard(cardId)}
          ><span aria-hidden="true" /></button>)}
        </div>
      </section>
    </div>
  </main>;
}
