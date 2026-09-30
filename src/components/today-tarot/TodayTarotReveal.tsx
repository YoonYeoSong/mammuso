"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TodayTarotLoadingScene } from "./TodayTarotRitualLoading";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { todayTarotRoutes, type TodayTarotSession } from "@/lib/today-tarot/flow";

/** Validates the confirmed session before showing the interpretation-loading scene. */
export function TodayTarotReveal({ clarifierMode = false }: { clarifierMode?: boolean }) {
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

  useEffect(() => {
    if (!isConfirmed) return;
    const timer = window.setTimeout(() => router.replace(todayTarotRoutes.result), 1750);
    return () => window.clearTimeout(timer);
  }, [isConfirmed, router]);

  if (!isConfirmed) return <main className="today-tarot-page today-tarot-ritual-page" />;

  return <TodayTarotLoadingScene
    backHref={clarifierMode ? `${todayTarotRoutes.selection}?mode=clarifier` : todayTarotRoutes.selection}
    ariaLabel="해석을 준비하는 중"
  />;
}
