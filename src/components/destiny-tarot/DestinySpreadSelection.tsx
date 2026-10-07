"use client";

import { useMemo, useRef, useState, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import styles from "./DestinyTarotExperience.module.css";
import { selectDestinyOrientation } from "@/lib/destiny-tarot/spread";
import type { DestinySelectedCard, DestinyTarotSessionDraft } from "@/lib/destiny-tarot/types";

type Flight = { left: number; top: number; width: number; height: number; x: number; y: number };

type Props = {
  session: DestinyTarotSessionDraft;
  setSession: Dispatch<SetStateAction<DestinyTarotSessionDraft | null>>;
  onMessageCheck: () => void;
};

function CardBack({ compact = false }: { compact?: boolean }) {
  return <span className={`${styles.destinyCardBack} ${compact ? styles.destinyCardBackCompact : ""}`} aria-hidden="true"><i>✦</i></span>;
}

export function DestinySpreadSelection({ session, setSession, onMessageCheck }: Props) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [rollingBackFrom, setRollingBackFrom] = useState<string | null>(null);
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const selectedCards = session.selectedCards ?? [];
  const positions = useMemo(() => [...(session.spreadPositions ?? [])].sort((left, right) => left.order - right.order), [session.spreadPositions]);
  const cardCount = session.cardCount ?? 0;
  const currentPosition = positions.find((position) => !selectedCards.some((card) => card.spreadPositionId === position.id));
  const selectedByCardId = new Map(selectedCards.map((card) => [card.cardId, card]));
  const selectedByPositionId = new Map(selectedCards.map((card) => [card.spreadPositionId, card]));
  const isComplete = cardCount > 0
    && selectedCards.length === cardCount
    && positions.length === cardCount
    && positions.every((position) => selectedByPositionId.has(position.id));

  function selectCard(cardId: string, source: HTMLButtonElement) {
    if (isSelecting || rollingBackFrom !== null || isComplete || !currentPosition || selectedByCardId.has(cardId) || !session.orientationMode) return;
    const target = slotRefs.current[currentPosition.id];
    const sourceBounds = source.getBoundingClientRect();
    const targetBounds = target?.getBoundingClientRect();
    const orientation = selectDestinyOrientation(session.orientationMode);
    const nextCard: DestinySelectedCard = {
      cardId,
      spreadPositionId: currentPosition.id,
      // Selection order is only a history record. Spread position order drives
      // every visual and reading order, including after a card is replaced.
      selectedOrder: Math.max(0, ...selectedCards.map((card) => card.selectedOrder)) + 1,
      orientation,
    };

    setIsSelecting(true);
    setSession((current) => current ? { ...current, selectedCards: [...(current.selectedCards ?? []), nextCard] } : current);
    if (targetBounds) {
      setFlight({
        left: sourceBounds.left,
        top: sourceBounds.top,
        width: sourceBounds.width,
        height: sourceBounds.height,
        x: targetBounds.left + targetBounds.width / 2 - sourceBounds.left - sourceBounds.width / 2,
        y: targetBounds.top + targetBounds.height / 2 - sourceBounds.top - sourceBounds.height / 2,
      });
    }
    window.setTimeout(() => { setFlight(null); setIsSelecting(false); }, 420);
  }

  function cancelCard(spreadPositionId: string) {
    if (isSelecting || rollingBackFrom !== null) return;
    setRollingBackFrom(spreadPositionId);
    window.setTimeout(() => {
      setSession((current) => current ? {
        ...current,
        // A selected-card record owns its orientation, so removing this one
        // card also removes only this card's orientation from the session.
        selectedCards: (current.selectedCards ?? []).filter((card) => card.spreadPositionId !== spreadPositionId),
      } : current);
      setRollingBackFrom(null);
    }, 240);
  }

  return <main className={styles.page}>
    <section className={`${styles.surface} ${styles.spreadSelection}`} aria-labelledby="destiny-spread-title">
      <p className={styles.eyebrow}>DESTINY SPREAD · {cardCount} CARDS</p>
      <h1 id="destiny-spread-title">질문을 위한<br />카드의 자리가 놓였어요.</h1>
      <section className={styles.questionCompact} aria-label="이번에 살펴볼 질문"><span>이번에 살펴볼 질문</span><strong>“{session.finalQuestion}”</strong></section>

      <section className={`${styles.spreadBoard} ${cardCount === 3 ? styles.spreadThree : cardCount === 5 ? styles.spreadFive : styles.spreadTen}`} aria-label="개인화된 운명 스프레드">
        <div className={styles.constellation} aria-hidden="true" />
        {positions.map((position) => {
          const selected = selectedByPositionId.get(position.id);
          const active = currentPosition?.id === position.id && !isComplete;
          const isRollingBack = selected?.spreadPositionId === rollingBackFrom;
          return <div className={`${styles.spreadSlot} ${active ? styles.spreadSlotActive : ""} ${selected ? styles.spreadSlotFilled : ""} ${isRollingBack ? styles.spreadSlotRollingBack : ""}`} key={position.id} ref={(node) => { slotRefs.current[position.id] = node; }}>
            {selected ? <button className={`${styles.slotCard} ${styles.selectedSlotCard}`} type="button" onClick={() => cancelCard(selected.spreadPositionId)} disabled={rollingBackFrom !== null} aria-label={`${position.order}번 ${position.label} 선택 취소`}><CardBack compact /></button> : <div className={styles.slotCard}><span className={styles.slotPlaceholder} aria-hidden="true">✦</span></div>}
            <p><b>{position.order}</b><span>{position.label}</span></p>
          </div>;
        })}
      </section>

      {!isComplete && currentPosition && <section className={styles.currentPosition} aria-live="polite">
        <p className={styles.selectionProgress}>{currentPosition.order} / {cardCount}</p>
        <h2>{currentPosition.label}</h2>
        <p>{currentPosition.description}</p>
        <small>이 의미를 생각하며 카드를 한 장 선택해 주세요.</small>
      </section>}

      {selectedCards.length > 0 && <p className={styles.rollbackHint}>선택한 카드를 누르면 다시 고를 수 있어요.</p>}

      {!isComplete ? <>
        <div className={styles.viewToggle} role="group" aria-label="카드 배열 방식">
          <button type="button" className={session.viewMode === "fan" ? styles.viewToggleActive : ""} aria-pressed={session.viewMode === "fan"} onClick={() => setSession((current) => current ? { ...current, viewMode: "fan" } : current)}>가로보기</button>
          <button type="button" className={session.viewMode === "grid" ? styles.viewToggleActive : ""} aria-pressed={session.viewMode === "grid"} onClick={() => setSession((current) => current ? { ...current, viewMode: "grid" } : current)}>배열</button>
        </div>
        <p className={styles.deckHint}>{session.viewMode === "fan" ? "좌우로 넘기며, 마음이 머무는 카드를 골라주세요." : "같은 순서의 78장을 천천히 살펴보며 골라주세요."}</p>
        {session.viewMode === "fan" ? <div className={styles.horizontalDeck} aria-label="78장 카드 가로 덱">
          {session.deckOrder?.map((cardId, index) => {
            const selected = selectedByCardId.get(cardId);
            const positionOrder = selected ? positions.find((position) => position.id === selected.spreadPositionId)?.order : undefined;
            return <button className={`${styles.deckCardButton} ${styles.horizontalDeckCard} ${selected ? styles.deckCardSelected : ""}`} type="button" key={cardId} disabled={Boolean(selected) || isSelecting || rollingBackFrom !== null} aria-label={selected ? `덱의 ${index + 1}번째 카드, ${positionOrder}번 자리에 선택됨` : `덱의 ${index + 1}번째 카드 선택`} onClick={(event) => selectCard(cardId, event.currentTarget)}><CardBack /></button>;
          })}
        </div> : <div className={styles.gridDeck} aria-label="78장 카드 배열">
          {session.deckOrder?.map((cardId, index) => {
            const selected = selectedByCardId.get(cardId);
            const positionOrder = selected ? positions.find((position) => position.id === selected.spreadPositionId)?.order : undefined;
            return <button className={`${styles.deckCardButton} ${styles.gridDeckCard} ${selected ? styles.deckCardSelected : ""}`} type="button" key={cardId} disabled={Boolean(selected) || isSelecting || rollingBackFrom !== null} aria-label={selected ? `덱의 ${index + 1}번째 카드, ${positionOrder}번 자리에 선택됨` : `덱의 ${index + 1}번째 카드 선택`} onClick={(event) => selectCard(cardId, event.currentTarget)}><CardBack />{selected && <em aria-hidden="true">{positionOrder}</em>}</button>;
          })}
        </div>}
      </> : <section className={styles.spreadCompletion} aria-live="polite">
        <p className={styles.eyebrow}>SPREAD COMPLETE</p>
        <h2>당신의 운명 스프레드가<br />완성되었어요.</h2>
        <p>선택한 카드들이 당신의 질문에 어떤 이야기를 들려줄지 확인해볼까요?</p>
        <button className={styles.primaryButton} type="button" onClick={onMessageCheck}>카드의 메시지 확인하기 <span>→</span></button>
      </section>}
      {flight && <span className={styles.cardFlight} aria-hidden="true" style={{ "--flight-left": `${flight.left}px`, "--flight-top": `${flight.top}px`, "--flight-width": `${flight.width}px`, "--flight-height": `${flight.height}px`, "--flight-x": `${flight.x}px`, "--flight-y": `${flight.y}px` } as CSSProperties}><CardBack /></span>}
    </section>
  </main>;
}
