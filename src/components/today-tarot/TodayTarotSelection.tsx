"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type TransitionEvent } from "react";
import { useRouter } from "next/navigation";
import { TodayTarotHeader } from "./TodayTarotHeader";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { todayTarotRoutes, type TodayTarotSession } from "@/lib/today-tarot/flow";

const CARD_COUNT = 78;
const VISIBLE_CARD_OFFSETS = [-3, -2, -1, 0, 1, 2, 3] as const;
const RENDERED_CARD_OFFSETS = [-4, ...VISIBLE_CARD_OFFSETS, 4] as const;
const SWIPE_THRESHOLD = 36;
const DRAG_FEEDBACK_LIMIT = 22;
const CARD_STEP = 78;
const SNAP_DURATION_MS = 320;
const SNAP_FALLBACK_MS = SNAP_DURATION_MS + 80;
const DECK_ENTRANCE_MS = 700;

type DeckCard = { cardId: string; index: number; offset: number };
type TransitionCard = { left: number; top: number; width: number; height: number; x: number; y: number };

function getDeckCardStyle(distance: number): CSSProperties {
  const absoluteDistance = Math.abs(distance);
  const isTransitionBuffer = absoluteDistance > 3;
  const depth = [
    { scale: 1, opacity: 1, y: 0, rotation: 0 },
    { scale: 0.94, opacity: 0.91, y: 10, rotation: 4 },
    { scale: 0.88, opacity: 0.76, y: 22, rotation: 6.5 },
    { scale: 0.81, opacity: 0.54, y: 37, rotation: 9.5 },
  ][absoluteDistance] ?? { scale: 0.81, opacity: 0.54, y: 37, rotation: 9.5 };

  return {
    // The lower center of every card follows the same virtual arc. This keeps
    // the fan balanced while the pre-shuffled deck moves beneath the viewport.
    "--deck-x": `${distance * CARD_STEP}px`,
    "--deck-y": `${depth.y}px`,
    "--deck-scale": `${depth.scale}`,
    "--deck-rotation": `${distance < 0 ? -depth.rotation : depth.rotation}deg`,
    // One hidden card is retained at each edge. It moves into the visible fan
    // on the next step, instead of mounting directly at its final position.
    "--deck-opacity": `${isTransitionBuffer ? 0 : depth.opacity}`,
    "--deck-muted-opacity": `${isTransitionBuffer ? 0 : depth.opacity * 0.76}`,
    "--deck-z-index": `${10 - absoluteDistance}`,
    "--deck-exit-x": `${distance * CARD_STEP * 1.45}px`,
    "--entrance-delay": `${(distance + 3) * 35}ms`,
  } as CSSProperties;
}

export function TodayTarotSelection() {
  const router = useRouter();
  const [session, setSession] = useState<TodayTarotSession | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [positionIndex, setPositionIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDeckReady, setIsDeckReady] = useState(false);
  const [isDeckEntering, setIsDeckEntering] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [transitionCard, setTransitionCard] = useState<TransitionCard | null>(null);
  const pointer = useRef<{ id: number; startX: number } | null>(null);
  const selectedCardElement = useRef<HTMLButtonElement | null>(null);
  const ignoreSyntheticCardTap = useRef(false);
  const activeIndexRef = useRef(0);
  const queuedMovesRef = useRef<Array<-1 | 1>>([]);
  const isAnimatingRef = useRef(false);
  const snapFallbackTimer = useRef<number | null>(null);
  const snapFrame = useRef<number | null>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(TODAY_TAROT_SESSION_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as TodayTarotSession;
      if (parsed.shuffledCardIds.length === CARD_COUNT) {
        setSession(parsed);
        // Begin in the middle of the already-shuffled deck so a natural 5–7 card fan is
        // visible immediately, without selecting or reordering anything.
        const restoredIndex = parsed.selectedCardId ? parsed.shuffledCardIds.indexOf(parsed.selectedCardId) : Math.floor(parsed.shuffledCardIds.length / 2);
        if (restoredIndex >= 0) {
          activeIndexRef.current = restoredIndex;
          setActiveIndex(restoredIndex);
          setPositionIndex(restoredIndex);
        }
      }
    } catch {
      // A corrupt or stale browser session should be prepared again instead.
    }
  }, []);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setIsDeckReady(true);
      setIsDeckEntering(true);
    });
    const entranceTimer = window.setTimeout(() => setIsDeckEntering(false), DECK_ENTRANCE_MS);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(entranceTimer);
    };
  }, [session]);

  useEffect(() => () => {
    if (snapFallbackTimer.current !== null) window.clearTimeout(snapFallbackTimer.current);
    if (snapFrame.current !== null) window.cancelAnimationFrame(snapFrame.current);
  }, []);

  function finishSnap() {
    if (!isAnimatingRef.current) return;
    if (snapFallbackTimer.current !== null) {
      window.clearTimeout(snapFallbackTimer.current);
      snapFallbackTimer.current = null;
    }

    // The displayed position is committed only after the same transform that
    // brought its card to center has completed.
    setPositionIndex(activeIndexRef.current);
    isAnimatingRef.current = false;
    snapFrame.current = window.requestAnimationFrame(() => {
      snapFrame.current = null;
      startQueuedMove();
    });
  }

  function startQueuedMove() {
    if (!session || isConfirming || isAnimatingRef.current) return;
    const direction = queuedMovesRef.current.shift();
    if (!direction) return;

    const nextIndex = Math.max(0, Math.min(session.shuffledCardIds.length - 1, activeIndexRef.current + direction));
    if (nextIndex === activeIndexRef.current) {
      startQueuedMove();
      return;
    }

    isAnimatingRef.current = true;
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
    // transitionend is authoritative; this only covers browsers that do not
    // dispatch it (for example when a transition is interrupted by the OS).
    snapFallbackTimer.current = window.setTimeout(finishSnap, SNAP_FALLBACK_MS);
  }

  function moveDeck(direction: -1 | 1) {
    if (!session || isConfirming) return;
    const queuedTarget = queuedMovesRef.current.reduce(
      (index, queuedDirection) => Math.max(0, Math.min(session.shuffledCardIds.length - 1, index + queuedDirection)),
      activeIndexRef.current,
    );
    const nextTarget = Math.max(0, Math.min(session.shuffledCardIds.length - 1, queuedTarget + direction));
    if (nextTarget === queuedTarget) return;

    // A selected card always occupies the center. Moving away resumes browsing,
    // so the previous selection is cleared without touching the deck order.
    setSelectedCardId(null);
    queuedMovesRef.current.push(direction);
    startQueuedMove();
  }

  function handleCardTransitionEnd(event: TransitionEvent<HTMLButtonElement>, index: number, offset: number) {
    if (
      event.target === event.currentTarget
      && event.propertyName === "transform"
      && offset === 0
      && index === activeIndexRef.current
    ) {
      finishSnap();
    }
  }

  function chooseCard(cardId: string, index: number) {
    if (ignoreSyntheticCardTap.current || isConfirming || isAnimatingRef.current) return;
    setSelectedCardId((current) => current === cardId ? null : cardId);
    setActiveIndex(index);
    activeIndexRef.current = index;
    setPositionIndex(index);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (isConfirming) return;
    pointer.current = { id: event.pointerId, startX: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointer.current || pointer.current.id !== event.pointerId || isConfirming) return;
    const nextOffset = Math.max(-DRAG_FEEDBACK_LIMIT, Math.min(DRAG_FEEDBACK_LIMIT, event.clientX - pointer.current.startX));
    setDragOffset(nextOffset);
  }

  function finishPointer(event: PointerEvent<HTMLDivElement>) {
    if (!pointer.current || pointer.current.id !== event.pointerId) return;
    const offset = event.clientX - pointer.current.startX;
    pointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragOffset(0);
    if (Math.abs(offset) >= SWIPE_THRESHOLD) {
      // Some mobile browsers still emit a click at the end of a drag. Keep that
      // synthetic click from selecting the card under the finger.
      ignoreSyntheticCardTap.current = true;
      window.setTimeout(() => { ignoreSyntheticCardTap.current = false; }, 180);
      moveDeck(offset < 0 ? 1 : -1);
    }
  }

  function cancelPointer(event: PointerEvent<HTMLDivElement>) {
    if (!pointer.current || pointer.current.id !== event.pointerId) return;
    pointer.current = null;
    setDragOffset(0);
  }

  function confirmCard() {
    if (!session || !selectedCardId || isConfirming) return;

    const selectedCard = selectedCardElement.current;
    if (!selectedCard) return;

    const bounds = selectedCard.getBoundingClientRect();
    const scale = 1.08;
    const scaledHeight = bounds.height * scale;
    const safeCenterTop = 20 + scaledHeight / 2;
    const safeCenterBottom = window.innerHeight - 20 - scaledHeight / 2;
    const targetCenterY = Math.max(
      safeCenterTop,
      Math.min(safeCenterBottom, window.innerHeight / 2 - 18),
    );
    setTransitionCard({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      x: window.innerWidth / 2 - (bounds.left + bounds.width / 2),
      y: targetCenterY - (bounds.top + bounds.height / 2),
    });

    const orientation = Math.random() < 0.5 ? "upright" : "reversed";
    const nextSession: TodayTarotSession = {
      ...session,
      step: "reveal",
      selectedCardId,
      orientation,
    };
    setSession(nextSession);
    window.sessionStorage.setItem(TODAY_TAROT_SESSION_KEY, JSON.stringify(nextSession));
    setIsConfirming(true);
    window.setTimeout(() => router.push(todayTarotRoutes.reveal), 680);
  }

  if (!session) return <main className="today-tarot-page today-tarot-selection-page">
    <div className="today-tarot-app-surface">
      <TodayTarotHeader backHref={todayTarotRoutes.preparing} />
      <section className="today-tarot-selection-empty"><h2>카드를 준비하고 있어요.</h2><a href={todayTarotRoutes.preparing}>준비 화면으로 돌아가기</a></section>
    </div>
  </main>;

  const visibleCards: DeckCard[] = RENDERED_CARD_OFFSETS.flatMap((offset) => {
    const index = activeIndex + offset;
    const cardId = session.shuffledCardIds[index];
    return cardId ? [{ cardId, index, offset }] : [];
  });
  const selectedIndex = selectedCardId ? session.shuffledCardIds.indexOf(selectedCardId) : -1;

  return <main className={`today-tarot-page today-tarot-selection-page ${isConfirming ? "is-confirming" : ""}`}>
    <div className="today-tarot-app-surface">
      <TodayTarotHeader backHref={todayTarotRoutes.intro} />
      <section className="today-tarot-selection" aria-labelledby="today-tarot-selection-title">
        <div className="today-tarot-selection-copy">
          <h2 id="today-tarot-selection-title">지금, 마음이 끌리는 카드를<br />한 장 선택해주세요.</h2>
          <p>첫 느낌이 가장 솔직한 답입니다.</p>
        </div>
        <div
          className={`today-tarot-deck ${isDeckReady ? "is-ready" : ""} ${isDeckEntering ? "is-entering" : ""} ${selectedCardId ? "has-selection" : ""} ${isConfirming ? "is-confirming" : ""}`}
          aria-label="섞인 78장 타로 덱"
        >
          <div
            className="today-tarot-deck-stage"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointer}
            onPointerCancel={cancelPointer}
          >
            <div className="today-tarot-deck-cards" style={{ transform: `translate3d(${dragOffset}px, 0, 0)` }}>
              {visibleCards.map(({ cardId, index, offset }) => {
                const isSelected = selectedCardId === cardId;
                const isTransitionBuffer = Math.abs(offset) > 3;
                const cardStyle = getDeckCardStyle(offset);
                return <button
                  key={cardId}
                  type="button"
                  className={`today-tarot-deck-card ${isTransitionBuffer ? "is-transition-buffer" : ""} ${offset === 0 ? "is-active" : ""} ${isSelected ? "is-selected" : ""}`}
                  style={cardStyle}
                  ref={isSelected ? selectedCardElement : undefined}
                  aria-label={`덱의 ${index + 1}번째 카드 선택`}
                  aria-pressed={isSelected}
                  aria-hidden={isTransitionBuffer}
                  tabIndex={isTransitionBuffer ? -1 : undefined}
                  onClick={() => chooseCard(cardId, index)}
                  onTransitionEnd={(event) => handleCardTransitionEnd(event, index, offset)}
                ><span aria-hidden="true" /></button>;
              })}
            </div>
            <button type="button" className="today-tarot-deck-arrow today-tarot-deck-arrow--previous" onClick={() => moveDeck(-1)} disabled={activeIndex === 0 || isConfirming} aria-label="이전 카드 보기">‹</button>
            <button type="button" className="today-tarot-deck-arrow today-tarot-deck-arrow--next" onClick={() => moveDeck(1)} disabled={activeIndex === session.shuffledCardIds.length - 1 || isConfirming} aria-label="다음 카드 보기">›</button>
          </div>
          <p className="today-tarot-deck-position" aria-live="polite"><b>현재 위치</b> {positionIndex + 1} <span>/</span> {CARD_COUNT}</p>
        </div>
        <div className={`today-tarot-selection-confirmation ${selectedCardId ? "is-visible" : ""}`} aria-live="polite">
          <p>{selectedCardId ? "이 카드로 진행할까요?" : "마음이 이끄는 카드를 골라주세요."}</p>
          <button type="button" onClick={confirmCard} disabled={!selectedCardId || isConfirming}>
            이 카드 선택하기
          </button>
        </div>
        {selectedIndex >= 0 && <span className="today-tarot-selection-status sr-only">덱의 {selectedIndex + 1}번째 카드를 선택했습니다.</span>}
      </section>
    </div>
    {transitionCard && <>
      <div
        className="today-tarot-selection-transition-card"
        aria-hidden="true"
        style={{
          "--transition-card-left": `${transitionCard.left}px`,
          "--transition-card-top": `${transitionCard.top}px`,
          "--transition-card-width": `${transitionCard.width}px`,
          "--transition-card-height": `${transitionCard.height}px`,
          "--transition-card-x": `${transitionCard.x}px`,
          "--transition-card-y": `${transitionCard.y}px`,
        } as CSSProperties}
      ><span /></div>
      <div className="today-tarot-selection-transition-wash" aria-hidden="true" />
    </>}
  </main>;
}
