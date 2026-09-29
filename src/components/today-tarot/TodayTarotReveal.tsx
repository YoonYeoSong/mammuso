"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TodayTarotHeader } from "./TodayTarotHeader";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { todayTarotRoutes, type TodayTarotSession } from "@/lib/today-tarot/flow";

/**
 * Route hand-off only. The card-face reveal itself intentionally remains outside
 * the selection-screen redesign; this verifies that a confirmed session reaches
 * step 5 instead of a missing route.
 */
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

  return <main className="today-tarot-page today-tarot-selection-page">
    <div className="today-tarot-app-surface">
      <TodayTarotHeader backHref={todayTarotRoutes.selection} />
      <section className="today-tarot-selection-empty" aria-live="polite">
        {isConfirmed && <><h2>선택한 카드를 공개할게요.</h2><p>잠시만 기다려주세요.</p></>}
      </section>
    </div>
  </main>;
}
