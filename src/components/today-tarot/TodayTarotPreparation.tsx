"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { todayTarotRoutes } from "@/lib/today-tarot/flow";
import { persistTodayTarotSession, prepareTodayTarotSession } from "@/lib/today-tarot/session";
import { TodayTarotHeader } from "./TodayTarotHeader";

const MINIMUM_PREPARATION_MS = 1700;

function MoonPhases() {
  return <div className="today-tarot-moon-phases" aria-label="오늘의 카드를 준비하는 중">
    <span className="today-tarot-phase today-tarot-phase--crescent-left" />
    <span className="today-tarot-phase today-tarot-phase--quarter-left" />
    <span className="today-tarot-phase today-tarot-phase--full" />
    <span className="today-tarot-phase today-tarot-phase--quarter-right" />
    <span className="today-tarot-phase today-tarot-phase--crescent-right" />
  </div>;
}

export function TodayTarotPreparation() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const startedAt = performance.now();

    const complete = async () => {
      // Only the date, session, and deck order are prepared here; no card is selected.
      const session = prepareTodayTarotSession();
      persistTodayTarotSession(session);
      const remaining = Math.max(0, MINIMUM_PREPARATION_MS - (performance.now() - startedAt));
      await new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
      if (active) router.replace(todayTarotRoutes.selection);
    };

    void complete();
    return () => { active = false; };
  }, [router]);

  return <main className="today-tarot-page today-tarot-prepare-page">
    <div className="today-tarot-app-surface">
      <TodayTarotHeader backHref={todayTarotRoutes.intro} />
      <section className="today-tarot-preparation" aria-labelledby="today-tarot-preparation-title">
        <h2 id="today-tarot-preparation-title">마음을 가다듬고<br />오늘의 카드를 준비하고 있어요.</h2>
        <p>지금 이 순간,<br />당신의 오늘 흐름을 준비하고 있습니다.</p>
        <MoonPhases />
        <span className="today-tarot-waiting">조금만 기다려주세요...</span>
      </section>
    </div>
  </main>;
}
