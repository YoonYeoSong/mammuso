"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { todayTarotRoutes } from "@/lib/today-tarot/flow";
import { persistTodayTarotSession, prepareTodayTarotSession } from "@/lib/today-tarot/session";
import { readTodayTarotProfile } from "@/lib/today-tarot/profile";
import { TodayTarotLoadingScene } from "./TodayTarotRitualLoading";

const MINIMUM_RITUAL_MS = 4500;
const EXIT_TRANSITION_MS = 420;
const wait = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

export function TodayTarotPreparation() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let active = true;

    const complete = async () => {
      const profile = readTodayTarotProfile();
      if (!profile) { router.replace(`${todayTarotRoutes.intro}?start=1`); return; }

      // Preparation and the visual sequence start together. If the preparation
      // ever becomes asynchronous, this still resolves at max(work, ritual).
      const prepareSession = Promise.resolve().then(() => {
        const session = prepareTodayTarotSession(profile);
        persistTodayTarotSession(session);
      });
      await Promise.all([prepareSession, wait(MINIMUM_RITUAL_MS)]);
      if (!active) return;
      setIsExiting(true);
      await wait(EXIT_TRANSITION_MS);
      if (active) router.replace(todayTarotRoutes.selection);
    };

    void complete();
    return () => { active = false; };
  }, [router]);

  return <TodayTarotLoadingScene
    backHref={todayTarotRoutes.intro}
    ariaLabel="오늘의 카드를 준비하는 중"
    phase="preparing"
    isExiting={isExiting}
  />;
}
