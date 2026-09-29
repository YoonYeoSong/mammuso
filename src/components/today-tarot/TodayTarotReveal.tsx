"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TodayTarotRitualLoading } from "./TodayTarotRitualLoading";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { todayTarotRoutes, type TodayTarotSession } from "@/lib/today-tarot/flow";

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

  if (!isConfirmed) return <main className="today-tarot-page today-tarot-ritual-page" />;

  return <TodayTarotRitualLoading
    backHref={todayTarotRoutes.selection}
    headingId="today-tarot-interpretation-title"
    headingLines={["당신의 사주와 카드를", "함께 해석하고 있어요."]}
    descriptionLines={["조금만 기다려주세요.", "당신을 위한 이야기를 정리하고 있습니다."]}
    status="해석 중..."
    ariaLabel="해석을 준비하는 중"
  />;
}
