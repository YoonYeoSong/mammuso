"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TodayTarotLoadingScene } from "./TodayTarotRitualLoading";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { todayTarotRoutes, type TodayTarotSession } from "@/lib/today-tarot/flow";

/** Validates the confirmed session before showing the interpretation-loading scene. */
export function TodayTarotReveal({ clarifierMode = false }: { clarifierMode?: boolean }) {
  const router = useRouter();
  const [session, setSession] = useState<TodayTarotSession | null | undefined>(undefined);
  const [apiReady, setApiReady] = useState(false);
  const [sequenceReady, setSequenceReady] = useState(false);
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

    void saveReading().finally(() => { if (active) setApiReady(true); });
    return () => { active = false; };
  }, [session]);

  useEffect(() => {
    const sequenceTimer = window.setTimeout(() => setSequenceReady(true), 4500);
    return () => window.clearTimeout(sequenceTimer);
  }, []);

  useEffect(() => {
    if (!apiReady || !sequenceReady) return;
    let active = true;
    setIsExiting(true);
    const exitTimer = window.setTimeout(() => { if (active) router.replace(todayTarotRoutes.result); }, 420);
    return () => { active = false; window.clearTimeout(exitTimer); };
  }, [apiReady, router, sequenceReady]);

  return <TodayTarotLoadingScene
    backHref={clarifierMode ? `${todayTarotRoutes.selection}?mode=clarifier` : todayTarotRoutes.selection}
    ariaLabel="해석을 준비하는 중"
    phase="interpreting"
    isExiting={isExiting}
  />;
}
