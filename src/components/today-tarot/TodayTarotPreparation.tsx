"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { todayTarotRoutes } from "@/lib/today-tarot/flow";
import { persistTodayTarotSession, prepareTodayTarotSession, TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { FULL_TAROT_DECK_SIZE, getTodayTarotCard } from "@/lib/today-tarot/deck";
import type { TodayTarotSession } from "@/lib/today-tarot/flow";
import { TodayTarotLoadingScene } from "./TodayTarotRitualLoading";

const EXIT_TRANSITION_MS = 420;

export function TodayTarotPreparation() {
  const router = useRouter();
  const [apiReady, setApiReady] = useState(false);
  const [sequenceReady, setSequenceReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const markSequenceReady = useCallback(() => setSequenceReady(true), []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      try {
        const saved = window.sessionStorage.getItem(TODAY_TAROT_SESSION_KEY);
        const existing = saved ? JSON.parse(saved) as TodayTarotSession : null;
        const hasStableDeck = existing?.deckOrder?.length === FULL_TAROT_DECK_SIZE && new Set(existing.deckOrder).size === FULL_TAROT_DECK_SIZE && existing.deckOrder.every(getTodayTarotCard);
        if (hasStableDeck) return;
      } catch { /* A stale session is replaced below. */ }
      persistTodayTarotSession(prepareTodayTarotSession());
    }).finally(() => { if (active) setApiReady(true); });

    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (!apiReady || !sequenceReady) return;
    let active = true;
    setIsExiting(true);
    const exitTimer = window.setTimeout(() => { if (active) router.replace(todayTarotRoutes.selection); }, EXIT_TRANSITION_MS);
    return () => { active = false; window.clearTimeout(exitTimer); };
  }, [apiReady, router, sequenceReady]);

  return <TodayTarotLoadingScene
    backHref={todayTarotRoutes.intro}
    ariaLabel="오늘의 카드를 준비하는 중"
    phase="preparing"
    isExiting={isExiting}
    onSequenceComplete={markSequenceReady}
  />;
}
