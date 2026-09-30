"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { todayTarotRoutes } from "@/lib/today-tarot/flow";
import { persistTodayTarotSession, prepareTodayTarotSession } from "@/lib/today-tarot/session";
import { readTodayTarotProfile } from "@/lib/today-tarot/profile";
import { TodayTarotLoadingScene } from "./TodayTarotRitualLoading";

const MINIMUM_RITUAL_MS = 4500;
const EXIT_TRANSITION_MS = 420;

export function TodayTarotPreparation() {
  const router = useRouter();
  const [apiReady, setApiReady] = useState(false);
  const [sequenceReady, setSequenceReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let active = true;
    const profile = readTodayTarotProfile();
    if (!profile) { router.replace(`${todayTarotRoutes.intro}?start=1`); return () => { active = false; }; }

    void Promise.resolve().then(() => {
      const session = prepareTodayTarotSession(profile);
      persistTodayTarotSession(session);
    }).finally(() => { if (active) setApiReady(true); });

    const sequenceTimer = window.setTimeout(() => { if (active) setSequenceReady(true); }, MINIMUM_RITUAL_MS);
    return () => { active = false; window.clearTimeout(sequenceTimer); };
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
  />;
}
