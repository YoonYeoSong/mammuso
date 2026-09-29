"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { todayTarotRoutes } from "@/lib/today-tarot/flow";
import { persistTodayTarotSession, prepareTodayTarotSession } from "@/lib/today-tarot/session";
import { TodayTarotRitualLoading } from "./TodayTarotRitualLoading";

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

  return <TodayTarotRitualLoading
    backHref={todayTarotRoutes.intro}
    headingId="today-tarot-preparation-title"
    headingLines={["마음을 가다듬고", "오늘의 카드를 준비하고 있어요."]}
    descriptionLines={["지금 이 순간,", "당신의 오늘 흐름을 준비하고 있습니다."]}
    status="조금만 기다려주세요..."
    ariaLabel="오늘의 카드를 준비하는 중"
  />;
}
