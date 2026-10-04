"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { TodayTarotHeader } from "./TodayTarotHeader";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { todayTarotRoutes, type TodayTarotSession } from "@/lib/today-tarot/flow";
import { FULL_TAROT_DECK_SIZE, getTodayTarotCard } from "@/lib/today-tarot/deck";

const CARD_COUNT = FULL_TAROT_DECK_SIZE;
const OFFSETS = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const;
const SWIPE_THRESHOLD = 36, INTENT_THRESHOLD = 6, DIRECTION_LOCK_RATIO = 1.15;
const SAMPLE_WINDOW_MS = 120, MAX_RELEASE_VELOCITY = 2.4;
const STRONG_FLICK_DISTANCE = 108, STRONG_FLICK_VELOCITY = .82, STRONG_FLICK_MAX_MS = 520;
const CARD_STEP = 78, FRICTION = 4.8, MOMENTUM_STOP_SPEED = .18, MAX_MOMENTUM_SPEED = 31, SNAP_MS = 220;
type Sample = { x: number; time: number };
type PointerState = { id: number; startX: number; startY: number; startTime: number; samples: Sample[]; intent: "pending" | "horizontal" | "vertical" };
type Flight = { left: number; top: number; width: number; height: number; x: number; y: number };
const depth = [{ scale: 1, opacity: 1, y: 0, rotation: 0 }, { scale: .94, opacity: .91, y: 10, rotation: 4 }, { scale: .88, opacity: .76, y: 22, rotation: 6.5 }, { scale: .81, opacity: .54, y: 37, rotation: 9.5 }] as const;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;

function cardStyle(distance: number): CSSProperties {
  const absolute = Math.abs(distance), lower = Math.min(3, Math.floor(absolute)), upper = Math.min(3, lower + 1), progress = clamp(absolute - lower, 0, 1);
  const from = depth[lower], to = depth[upper], edgeFade = clamp(4 - absolute, 0, 1);
  return {
    "--deck-x": `${distance * CARD_STEP}px`, "--deck-y": `${mix(from.y, to.y, progress)}px`, "--deck-scale": `${mix(from.scale, to.scale, progress)}`,
    "--deck-rotation": `${(distance < 0 ? -1 : 1) * mix(from.rotation, to.rotation, progress)}deg`, "--deck-opacity": `${mix(from.opacity, to.opacity, progress) * edgeFade}`,
    "--deck-muted-opacity": `${mix(from.opacity, to.opacity, progress) * edgeFade * .76}`, "--deck-z-index": `${10 - Math.round(absolute * 2)}`,
  } as CSSProperties;
}

export function TodayTarotSelection({ clarifierMode = false }: { clarifierMode?: boolean }) {
  const router = useRouter();
  const [session, setSession] = useState<TodayTarotSession | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isContinuousMotion, setIsContinuousMotion] = useState(false);
  const [isDeckReady, setIsDeckReady] = useState(false);
  const [isDeckEntering, setIsDeckEntering] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const pointer = useRef<PointerState | null>(null), selectedElement = useRef<HTMLButtonElement | null>(null);
  const activeRef = useRef(0), positionRef = useRef(0), movingRef = useRef(false);
  const momentumFrame = useRef<number | null>(null), snapFrame = useRef<number | null>(null), snapTimer = useRef<number | null>(null), tapTimer = useRef<number | null>(null), ignoreTap = useRef(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(TODAY_TAROT_SESSION_KEY); if (!saved) return;
      const parsed = JSON.parse(saved) as TodayTarotSession;
      if (parsed.shuffledCardIds.length !== CARD_COUNT || new Set(parsed.shuffledCardIds).size !== CARD_COUNT || !parsed.shuffledCardIds.every(getTodayTarotCard)) return;
      setSession(parsed);
      const index = clarifierMode ? Math.floor(CARD_COUNT / 2) : (parsed.selectedCardId ? parsed.shuffledCardIds.indexOf(parsed.selectedCardId) : Math.floor(CARD_COUNT / 2));
      if (index >= 0) { activeRef.current = index; positionRef.current = index; setActiveIndex(index); setPosition(index); }
    } catch { /* A stale session is re-prepared by the existing flow. */ }
  }, [clarifierMode]);
  useEffect(() => { const frame = requestAnimationFrame(() => { setIsDeckReady(true); setIsDeckEntering(true); }); const timer = window.setTimeout(() => setIsDeckEntering(false), 700); return () => { cancelAnimationFrame(frame); clearTimeout(timer); }; }, [session]);
  useEffect(() => () => { [momentumFrame, snapFrame].forEach((ref) => ref.current !== null && cancelAnimationFrame(ref.current)); [snapTimer, tapTimer].forEach((ref) => ref.current !== null && clearTimeout(ref.current)); }, []);

  const updatePosition = (next: number) => {
    if (!session) return; const safe = clamp(next, 0, session.shuffledCardIds.length - 1); positionRef.current = safe; setPosition(safe);
    const nearest = Math.round(safe); if (nearest !== activeRef.current) { activeRef.current = nearest; setActiveIndex(nearest); }
  };
  const clearMotion = () => { if (momentumFrame.current !== null) cancelAnimationFrame(momentumFrame.current); if (snapFrame.current !== null) cancelAnimationFrame(snapFrame.current); if (snapTimer.current !== null) clearTimeout(snapTimer.current); momentumFrame.current = snapFrame.current = snapTimer.current = null; };
  const snapTo = (target: number) => {
    if (!session) return; clearMotion(); movingRef.current = true; setIsContinuousMotion(false);
    snapFrame.current = requestAnimationFrame(() => { snapFrame.current = null; updatePosition(target); snapTimer.current = window.setTimeout(() => { movingRef.current = false; snapTimer.current = null; }, SNAP_MS + 40); });
  };
  const stopMotion = () => {
    if (!movingRef.current) return; clearMotion(); movingRef.current = false; setIsContinuousMotion(true);
    requestAnimationFrame(() => setIsContinuousMotion(false));
  };
  const startMomentum = (releaseVelocity: number) => {
    if (!session) return; clearMotion(); movingRef.current = true; setIsContinuousMotion(true);
    let velocity = clamp(-releaseVelocity * 1000 / CARD_STEP, -MAX_MOMENTUM_SPEED, MAX_MOMENTUM_SPEED), previous: number | null = null;
    const tick = (now: number) => { const elapsed = previous === null ? .016 : clamp((now - previous) / 1000, .001, .032); previous = now; const next = clamp(positionRef.current + velocity * elapsed, 0, session.shuffledCardIds.length - 1); updatePosition(next); velocity *= Math.exp(-FRICTION * elapsed);
      if (next === 0 || next === session.shuffledCardIds.length - 1 || Math.abs(velocity) <= MOMENTUM_STOP_SPEED) { momentumFrame.current = null; snapTo(Math.round(next)); return; } momentumFrame.current = requestAnimationFrame(tick); };
    momentumFrame.current = requestAnimationFrame(tick);
  };
  const moveDeck = (direction: -1 | 1) => { if (!session || isConfirming) return; setSelectedCardId(null); setSelectionNotice(null); snapTo(activeRef.current + direction); };
  const suppressTap = () => { ignoreTap.current = true; if (tapTimer.current !== null) clearTimeout(tapTimer.current); tapTimer.current = window.setTimeout(() => { ignoreTap.current = false; tapTimer.current = null; }, 600); };

  const chooseCard = (cardId: string, index: number) => {
    if (ignoreTap.current) { ignoreTap.current = false; return; } if (isConfirming || movingRef.current) return;
    const selectedIds = session?.selectedCardIds ?? (session?.selectedCardId ? [session.selectedCardId] : []); if (clarifierMode && selectedIds.includes(cardId)) return;
    updatePosition(index); if (!getTodayTarotCard(cardId)?.imageReady) { setSelectedCardId(null); setSelectionNotice("아직 준비 중인 카드입니다. 다른 카드를 선택해주세요."); return; }
    setSelectionNotice(null); setSelectedCardId((current) => current === cardId ? null : cardId);
  };
  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isConfirming || (event.target instanceof Element && event.target.closest(".today-tarot-deck-arrow"))) return; stopMotion(); ignoreTap.current = false;
    pointer.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, startTime: event.timeStamp, samples: [{ x: event.clientX, time: event.timeStamp }], intent: "pending" };
  };
  const sample = (event: PointerEvent<HTMLDivElement>, state: PointerState) => { const next = { x: event.clientX, time: event.timeStamp }; state.samples = [...state.samples, next].filter((item) => item.time >= next.time - SAMPLE_WINDOW_MS); };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = pointer.current; if (!state || state.id !== event.pointerId || isConfirming) return; const x = event.clientX - state.startX, y = event.clientY - state.startY;
    if (state.intent === "pending") { if (Math.abs(x) < INTENT_THRESHOLD && Math.abs(y) < INTENT_THRESHOLD) return; if (Math.abs(y) > Math.abs(x) * DIRECTION_LOCK_RATIO) { state.intent = "vertical"; return; } if (Math.abs(x) <= Math.abs(y) * DIRECTION_LOCK_RATIO) return; state.intent = "horizontal"; event.currentTarget.setPointerCapture(event.pointerId); setIsDragging(true); }
    if (state.intent === "horizontal") { sample(event, state); setDragOffset(clamp(x * .14, -30, 30)); }
  };
  const finish = (event: PointerEvent<HTMLDivElement>) => {
    const state = pointer.current; if (!state || state.id !== event.pointerId) return; const offset = event.clientX - state.startX, horizontal = state.intent === "horizontal"; if (horizontal) sample(event, state); pointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); if (horizontal) setIsDragging(false); setDragOffset(0); if (!horizontal || Math.abs(offset) < SWIPE_THRESHOLD) return;
    const first = state.samples[0], last = state.samples.at(-1), velocity = first && last && last.time - first.time >= 12 ? clamp((last.x - first.x) / (last.time - first.time), -MAX_RELEASE_VELOCITY, MAX_RELEASE_VELOCITY) : 0;
    suppressTap(); setSelectedCardId(null); setSelectionNotice(null); const strong = Math.abs(offset) >= STRONG_FLICK_DISTANCE && Math.abs(velocity) >= STRONG_FLICK_VELOCITY && event.timeStamp - state.startTime <= STRONG_FLICK_MAX_MS;
    if (strong) startMomentum(velocity); else snapTo(activeRef.current + (offset < 0 ? 1 : -1));
  };
  const cancel = (event: PointerEvent<HTMLDivElement>) => { if (!pointer.current || pointer.current.id !== event.pointerId) return; pointer.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); setIsDragging(false); setDragOffset(0); };
  const confirm = () => {
    if (!session || !selectedCardId || isConfirming || session.shuffledCardIds[activeRef.current] !== selectedCardId) return; const card = getTodayTarotCard(selectedCardId); if (!card?.imageReady) return;
    const node = selectedElement.current; if (!node) return; const bounds = node.getBoundingClientRect(), scale = 1.08, h = bounds.height * scale, y = clamp(window.innerHeight / 2 - 18, 20 + h / 2, window.innerHeight - 20 - h / 2);
    setFlight({ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height, x: window.innerWidth / 2 - bounds.left - bounds.width / 2, y: y - bounds.top - bounds.height / 2 });
    const orientation = session.orientation ?? (Math.random() < .5 ? "upright" : "reversed"), prior = session.selectedCardIds ?? (session.selectedCardId ? [session.selectedCardId] : []);
    const next = { ...session, step: "reveal" as const, selectedCardIds: clarifierMode ? [...prior, selectedCardId] : [selectedCardId], selectedCardId: clarifierMode ? session.selectedCardId : selectedCardId, clarifierCardId: clarifierMode ? selectedCardId : session.clarifierCardId, orientation };
    setSession(next); sessionStorage.setItem(TODAY_TAROT_SESSION_KEY, JSON.stringify(next)); setIsConfirming(true); setTimeout(() => router.push(clarifierMode ? `${todayTarotRoutes.reveal}?mode=clarifier` : todayTarotRoutes.reveal), 680);
  };
  if (!session) return <main className="today-tarot-page today-tarot-selection-page"><div className="today-tarot-app-surface"><TodayTarotHeader backHref={clarifierMode ? todayTarotRoutes.result : todayTarotRoutes.preparing} /><section className="today-tarot-selection-empty"><h2>카드를 준비하고 있어요.</h2><a href={todayTarotRoutes.preparing}>준비 화면으로 돌아가기</a></section></div></main>;
  const anchor = clamp(Math.floor(position), 0, session.shuffledCardIds.length - 1), selectedIndex = selectedCardId ? session.shuffledCardIds.indexOf(selectedCardId) : -1, alreadySelected = session.selectedCardIds ?? (session.selectedCardId ? [session.selectedCardId] : []);
  const cards = OFFSETS.flatMap((offset) => { const index = anchor + offset, cardId = session.shuffledCardIds[index]; return cardId ? [{ cardId, index, distance: index - position }] : []; });
  return <main className={`today-tarot-page today-tarot-selection-page ${isConfirming ? "is-confirming" : ""}`}><div className="today-tarot-app-surface"><TodayTarotHeader backHref={clarifierMode ? todayTarotRoutes.result : todayTarotRoutes.intro} /><section className="today-tarot-selection" aria-labelledby="today-tarot-selection-title"><div className="today-tarot-selection-copy"><h2 id="today-tarot-selection-title">{clarifierMode ? <>오늘의 흐름을 더 비출<br />보조카드 한 장을 골라주세요.</> : <>지금, 마음이 끌리는 카드를<br />한 장 선택해주세요.</>}</h2><p>{clarifierMode ? "메인카드와 다른 카드가 오늘의 조언을 보탭니다." : "첫 느낌이 가장 솔직한 답입니다."}</p></div><div className={`today-tarot-deck ${isDeckReady ? "is-ready" : ""} ${isDeckEntering ? "is-entering" : ""} ${selectedCardId ? "has-selection" : ""} ${isContinuousMotion ? "is-in-continuous-motion" : ""}`} aria-label="섞인 78장 타로 덱"><div className="today-tarot-deck-stage" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={finish} onPointerCancel={cancel}><div className={`today-tarot-deck-cards ${isDragging ? "is-dragging" : ""}`} style={{ transform: `translate3d(${dragOffset}px,0,0)` }}>{cards.map(({ cardId, index, distance }) => { const selected = selectedCardId === cardId, buffer = Math.abs(distance) > 3.25; return <button key={cardId} type="button" className={`today-tarot-deck-card ${buffer ? "is-transition-buffer" : ""} ${Math.abs(distance) < .001 ? "is-active" : ""} ${selected ? "is-selected" : ""}`} style={cardStyle(distance)} ref={selected ? selectedElement : undefined} aria-label={clarifierMode && alreadySelected.includes(cardId) ? "이미 선택된 카드" : `덱의 ${index + 1}번째 카드 선택`} aria-pressed={selected} aria-hidden={buffer} tabIndex={buffer ? -1 : undefined} disabled={clarifierMode && alreadySelected.includes(cardId)} onClick={() => chooseCard(cardId, index)}><span aria-hidden="true" /></button>; })}</div><button type="button" className="today-tarot-deck-arrow today-tarot-deck-arrow--previous" onClick={() => moveDeck(-1)} disabled={activeIndex === 0 || isConfirming} aria-label="이전 카드 보기">‹</button><button type="button" className="today-tarot-deck-arrow today-tarot-deck-arrow--next" onClick={() => moveDeck(1)} disabled={activeIndex === CARD_COUNT - 1 || isConfirming} aria-label="다음 카드 보기">›</button></div><p className="today-tarot-deck-position" aria-live="polite"><b>현재 위치</b> {activeIndex + 1} <span>/</span> {CARD_COUNT}</p></div><div className={`today-tarot-selection-confirmation ${selectedCardId ? "is-visible" : ""}`} aria-live="polite"><p>{selectedCardId ? "이 카드로 진행할까요?" : clarifierMode ? "메인카드가 아닌 한 장을 골라주세요." : "마음이 이끄는 카드를 골라주세요."}</p><button type="button" onClick={confirm} disabled={!selectedCardId || isConfirming}>{clarifierMode ? "보조카드 선택하기" : "이 카드 선택하기"}</button></div>{selectionNotice && <p className="today-tarot-selection-notice" role="status">{selectionNotice}</p>}{selectedIndex >= 0 && <span className="today-tarot-selection-status sr-only">덱의 {selectedIndex + 1}번째 카드를 선택했습니다.</span>}</section></div>{flight && <><div className="today-tarot-selection-transition-card" aria-hidden="true" style={{ "--transition-card-left": `${flight.left}px`, "--transition-card-top": `${flight.top}px`, "--transition-card-width": `${flight.width}px`, "--transition-card-height": `${flight.height}px`, "--transition-card-x": `${flight.x}px`, "--transition-card-y": `${flight.y}px` } as CSSProperties}><span /></div><div className="today-tarot-selection-transition-wash" aria-hidden="true" /></>}</main>;
}
