"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TodayTarotLoadingScene } from "./TodayTarotRitualLoading";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { todayTarotRoutes, type TodayTarotSession } from "@/lib/today-tarot/flow";

/** Validates the confirmed session before showing the interpretation-loading scene. */
export function TodayTarotReveal({ clarifierMode = false }: { clarifierMode?: boolean }) {
  const router = useRouter();
  const [session, setSession] = useState<TodayTarotSession | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(TODAY_TAROT_SESSION_KEY);
      const session = saved ? JSON.parse(saved) as TodayTarotSession : null;
      if (!session?.selectedCardId || !session.orientation) {
        router.replace(todayTarotRoutes.selection);
        return;
      }
      setSession(session);
    } catch {
      router.replace(todayTarotRoutes.selection);
    }
  }, [router]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    const wait = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

    const saveReading = async () => {
      try {
        const authResponse = await fetch("/api/auth/me");
        const auth = authResponse.ok ? await authResponse.json() as { user: unknown } : { user: null };
        if (!auth.user) return;
        await fetch("/api/today-tarot/reading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            dateKey: session.dateKey,
            mainCardId: session.selectedCardId,
            orientation: session.orientation,
            clarifierCardId: session.clarifierCardId,
          }),
        });
      } catch {
        // A save failure must not block the locally prepared reading.
      }
    };

    const complete = async () => {
      await Promise.all([saveReading(), wait(4500)]);
      if (!active) return;
      setIsExiting(true);
      await wait(420);
      if (active) router.replace(todayTarotRoutes.result);
    };

    void complete();
    return () => { active = false; };
  }, [router, session]);

  if (!session) return <main className="today-tarot-page today-tarot-ritual-page" />;

  return <TodayTarotLoadingScene
    backHref={clarifierMode ? `${todayTarotRoutes.selection}?mode=clarifier` : todayTarotRoutes.selection}
    ariaLabel="해석을 준비하는 중"
    phase="interpreting"
    isExiting={isExiting}
  />;
}
