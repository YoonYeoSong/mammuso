"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TodayTarotHeader } from "./TodayTarotHeader";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { todayTarotRoutes, type TodayTarotSession } from "@/lib/today-tarot/flow";

function MoonPhaseLoader() {
  return <div className="today-tarot-interpretation-phases" aria-label="해석을 준비하는 중">
    <span className="today-tarot-interpretation-phase today-tarot-interpretation-phase--crescent-left" />
    <span className="today-tarot-interpretation-phase today-tarot-interpretation-phase--quarter-left" />
    <span className="today-tarot-interpretation-phase today-tarot-interpretation-phase--full" />
    <span className="today-tarot-interpretation-phase today-tarot-interpretation-phase--quarter-right" />
    <span className="today-tarot-interpretation-phase today-tarot-interpretation-phase--crescent-right" />
  </div>;
}

/** Validates the confirmed session before showing the interpretation-loading scene. */
export function TodayTarotReveal() {
  const router = useRouter();
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(TODAY_TAROT_SESSION_KEY);
      const session = saved ? JSON.parse(saved) as TodayTarotSession : null;
      if (!session?.selectedCardId || !session.orientation) {
        router.replace(todayTarotRoutes.selection);
        return;
      }
      setIsConfirmed(true);
    } catch {
      router.replace(todayTarotRoutes.selection);
    }
  }, [router]);

  return <main className="today-tarot-page today-tarot-reveal-page">
    <div className="today-tarot-app-surface">
      <TodayTarotHeader backHref={todayTarotRoutes.selection} />
      <section className="today-tarot-interpretation" aria-live="polite" aria-labelledby="today-tarot-interpretation-title">
        <div className="today-tarot-interpretation-visual" aria-hidden="true" />
        {isConfirmed && <div className="today-tarot-interpretation-copy">
          <h2 id="today-tarot-interpretation-title">당신의 사주와 카드를<br />함께 해석하고 있어요.</h2>
          <p>조금만 기다려주세요.<br />당신을 위한 이야기를 정리하고 있습니다.</p>
          <MoonPhaseLoader />
          <small className="today-tarot-interpretation-status">해석 중...</small>
        </div>}
      </section>
    </div>
  </main>;
}
