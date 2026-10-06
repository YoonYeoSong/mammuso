"use client";

import { useRef, useState, type CSSProperties, type Dispatch, type SetStateAction } from "react";
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
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const selectedCards = session.selectedCards ?? [];
  const positions = session.spreadPositions ?? [];
  const cardCount = session.cardCount ?? 0;
  const currentPosition = positions[selectedCards.length];
  const selectedByCardId = new Map(selectedCards.map((card) => [card.cardId, card]));
  const selectedByPositionId = new Map(selectedCards.map((card) => [card.spreadPositionId, card]));
  const isComplete = selectedCards.length === cardCount && cardCount > 0;

  function selectCard(cardId: string, source: HTMLButtonElement) {
    if (isSelecting || isComplete || !currentPosition || selectedByCardId.has(cardId) || !session.orientationMode) return;
    const target = slotRefs.current[currentPosition.id];
    const sourceBounds = source.getBoundingClientRect();
    const targetBounds = target?.getBoundingClientRect();
    const orientation = selectDestinyOrientation(session.orientationMode);
    const nextCard: DestinySelectedCard = {
      cardId,
      spreadPositionId: currentPosition.id,
      selectedOrder: selectedCards.length + 1,
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
          return <div className={`${styles.spreadSlot} ${active ? styles.spreadSlotActive : ""} ${selected ? styles.spreadSlotFilled : ""}`} key={position.id} ref={(node) => { slotRefs.current[position.id] = node; }}>
            <div className={styles.slotCard}>{selected ? <CardBack compact /> : <span className={styles.slotPlaceholder} aria-hidden="true">✦</span>}</div>
            <p><b>{position.order}</b><span>{position.label}</span></p>
          </div>;
        })}
      </section>

      {!isComplete && currentPosition && <section className={styles.currentPosition} aria-live="polite">
        <p className={styles.selectionProgress}>{selectedCards.length + 1} / {cardCount}</p>
        <h2>{currentPosition.label}</h2>
        <p>{currentPosition.description}</p>
        <small>이 의미를 생각하며 카드를 한 장 선택해 주세요.</small>
      </section>}

      {!isComplete ? <>
        <div className={styles.viewToggle} role="group" aria-label="카드 배열 방식">
          <button type="button" className={session.viewMode === "fan" ? styles.viewToggleActive : ""} aria-pressed={session.viewMode === "fan"} onClick={() => setSession((current) => current ? { ...current, viewMode: "fan" } : current)}>부채꼴</button>
          <button type="button" className={session.viewMode === "grid" ? styles.viewToggleActive : ""} aria-pressed={session.viewMode === "grid"} onClick={() => setSession((current) => current ? { ...current, viewMode: "grid" } : current)}>배열</button>
        </div>
        <p className={styles.deckHint}>{session.viewMode === "fan" ? "좌우로 넘기며, 마음이 머무는 카드를 골라주세요." : "같은 순서의 78장을 천천히 살펴보며 골라주세요."}</p>
        {session.viewMode === "fan" ? <div className={styles.fanDeck} aria-label="78장 카드 부채꼴">
          {session.deckOrder?.map((cardId, index) => {
            const selected = selectedByCardId.get(cardId);
            const rotation = (index % 11 - 5) * 1.2;
            return <button className={`${styles.deckCardButton} ${styles.fanDeckCard} ${selected ? styles.deckCardSelected : ""}`} type="button" key={cardId} disabled={Boolean(selected) || isSelecting} aria-label={selected ? `덱의 ${index + 1}번째 카드, ${selected.selectedOrder}번 선택됨` : `덱의 ${index + 1}번째 카드 선택`} onClick={(event) => selectCard(cardId, event.currentTarget)} style={{ "--fan-rotation": `${rotation}deg` } as CSSProperties}><CardBack /></button>;
          })}
        </div> : <div className={styles.gridDeck} aria-label="78장 카드 배열">
          {session.deckOrder?.map((cardId, index) => {
            const selected = selectedByCardId.get(cardId);
            return <button className={`${styles.deckCardButton} ${styles.gridDeckCard} ${selected ? styles.deckCardSelected : ""}`} type="button" key={cardId} disabled={Boolean(selected) || isSelecting} aria-label={selected ? `덱의 ${index + 1}번째 카드, ${selected.selectedOrder}번 선택됨` : `덱의 ${index + 1}번째 카드 선택`} onClick={(event) => selectCard(cardId, event.currentTarget)}><CardBack />{selected && <em aria-hidden="true">{selected.selectedOrder}</em>}</button>;
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
