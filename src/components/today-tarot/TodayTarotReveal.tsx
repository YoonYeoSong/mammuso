"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TodayTarotLoadingScene } from "./TodayTarotRitualLoading";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { todayTarotRoutes, type TodayTarotSession } from "@/lib/today-tarot/flow";
import { getTodayTarotCard } from "@/lib/today-tarot/deck";

const CARD_REVEAL_DURATION_MS = 1250;

/** Validates the confirmed session before showing the interpretation-loading scene. */
export function TodayTarotReveal({ clarifierMode = false }: { clarifierMode?: boolean }) {
  const router = useRouter();
  const [session, setSession] = useState<TodayTarotSession | null | undefined>(undefined);
  const [apiReady, setApiReady] = useState(false);
  const [sequenceReady, setSequenceReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [cardRevealComplete, setCardRevealComplete] = useState(false);
  const markSequenceReady = useCallback(() => setSequenceReady(true), []);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(TODAY_TAROT_SESSION_KEY);
      const session = saved ? JSON.parse(saved) as TodayTarotSession : null;
      const cardId = clarifierMode ? session?.clarifierCardId : session?.selectedCardId;
      const selectedCard = cardId ? getTodayTarotCard(cardId) : undefined;
      if (!session?.selectedCardId || !session.orientation || !selectedCard?.imageReady) {
        router.replace(todayTarotRoutes.selection);
        return;
      }
      setSession(session);
    } catch {
      router.replace(todayTarotRoutes.selection);
    }
  }, [clarifierMode, router]);

  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => setCardRevealComplete(true), CARD_REVEAL_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [session]);

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
    if (!apiReady || !sequenceReady) return;
    let active = true;
    setIsExiting(true);
    const exitTimer = window.setTimeout(() => { if (active) router.replace(todayTarotRoutes.result); }, 420);
    return () => { active = false; window.clearTimeout(exitTimer); };
  }, [apiReady, router, sequenceReady]);

  const revealedCardId = clarifierMode ? session?.clarifierCardId : session?.selectedCardId;
  const revealedCard = revealedCardId ? getTodayTarotCard(revealedCardId) : undefined;

  if (session && revealedCard && !cardRevealComplete) return <main className="today-tarot-page today-tarot-card-reveal-page">
    <div className="today-tarot-app-surface">
      <section className="today-tarot-card-reveal" aria-live="polite">
        <p>{clarifierMode ? "보조카드 공개" : "선택한 카드 공개"}</p>
        <div className={`today-tarot-card-reveal-art ${session.orientation === "reversed" ? "is-reversed" : ""}`}>
          <Image src={revealedCard.image} alt={`${revealedCard.nameKo} 카드`} fill sizes="min(62vw, 236px)" priority />
        </div>
        <h1>{revealedCard.nameKo}</h1>
        <small>{revealedCard.nameEn} · {session.orientation === "reversed" ? "역방향" : "정방향"}</small>
      </section>
    </div>
  </main>;

  return <TodayTarotLoadingScene
    backHref={clarifierMode ? `${todayTarotRoutes.selection}?mode=clarifier` : todayTarotRoutes.selection}
    ariaLabel="해석을 준비하는 중"
    phase="interpreting"
    isExiting={isExiting}
    onSequenceComplete={markSequenceReady}
  />;
}
