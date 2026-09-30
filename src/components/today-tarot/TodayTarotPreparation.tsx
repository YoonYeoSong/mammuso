"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { todayTarotRoutes } from "@/lib/today-tarot/flow";
import { persistTodayTarotSession, prepareTodayTarotSession } from "@/lib/today-tarot/session";
import { TodayTarotLoadingScene } from "./TodayTarotRitualLoading";

const MINIMUM_PREPARATION_MS = 1700;

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

  return <TodayTarotLoadingScene
    backHref={todayTarotRoutes.intro}
    ariaLabel="오늘의 카드를 준비하는 중"
  />;
}
