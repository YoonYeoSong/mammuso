"use client";

import Image, { getImageProps } from "next/image";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import styles from "./DestinyTarotExperience.module.css";
import { createDestinyReadingInput, createFallbackDestinyReading, isValidDestinyReading, selectedCardsByPosition } from "@/lib/destiny-tarot/reading";
import { getTarotAsset } from "@/lib/tarot/assets";
import type { DestinyReadingResponse, DestinyTarotSessionDraft } from "@/lib/destiny-tarot/types";
import { getDestinyReadingProfile } from "@/lib/destiny-tarot/profiles";

type RevealStage = "intro" | "reveal" | "complete" | "loading" | "result";
type ReadingStatus = "idle" | "loading" | "success" | "error";

type Props = {
  session: DestinyTarotSessionDraft;
  onRestart: () => void;
};

const tarotArtSizes = "(max-width: 359px) 27vw, (max-width: 480px) 24vw, 120px";

function orientationLabel(orientation: "upright" | "reversed") {
  return orientation === "reversed" ? "역방향" : "정방향";
}

function firstSentence(text: string) {
  const trimmed = text.trim();
  const boundary = trimmed.search(/[.!?]/);
  return boundary >= 0 ? trimmed.slice(0, boundary + 1) : trimmed;
}

function CardBack() {
  return <span className={styles.destinyCardBack} aria-hidden="true"><i>✦</i></span>;
}

function TarotArt({ cardId, orientation, alt, eager = false }: { cardId: string; orientation: "upright" | "reversed"; alt: string; eager?: boolean }) {
  const card = getTarotAsset(cardId);
  if (!card?.imageReady) return <span className={styles.cardUnavailable} aria-label={alt}>✦</span>;
  return <span className={`${styles.tarotArt} ${orientation === "reversed" ? styles.tarotArtReversed : ""}`}><Image src={card.image} alt={alt} fill sizes={tarotArtSizes} loading={eager ? "eager" : "lazy"} /></span>;
}

function Spread({ session, revealedCount, flippingPositionId }: { session: DestinyTarotSessionDraft; revealedCount: number; flippingPositionId?: string }) {
  const positions = [...(session.spreadPositions ?? [])].sort((left, right) => left.order - right.order);
  const selectedByPosition = selectedCardsByPosition(session.selectedCards ?? []);
  const cardCount = session.cardCount ?? 3;
  return <section className={`${styles.spreadBoard} ${cardCount === 3 ? styles.spreadThree : cardCount === 5 ? styles.spreadFive : styles.spreadTen} ${styles.revealSpreadBoard}`} aria-label="완성 중인 운명 스프레드">
    <div className={styles.constellation} aria-hidden="true" />
    {positions.map((position, index) => {
      const selected = selectedByPosition.get(position.id);
      const isRevealed = index < revealedCount;
      const isFlipping = position.id === flippingPositionId;
      if (!selected) return null;
      return <article className={`${styles.spreadSlot} ${isRevealed ? styles.revealedSlot : ""} ${isFlipping ? styles.revealActiveSlot : ""}`} key={position.id}>
        <div className={`${styles.slotCard} ${styles.revealSlotCard}`}>
          {isFlipping ? <div className={`${styles.cardFlip} ${isRevealed ? styles.cardFlipRevealed : ""}`}>
            <span className={`${styles.cardFlipFace} ${styles.cardFlipBack}`}><CardBack /></span>
            <span className={`${styles.cardFlipFace} ${styles.cardFlipFront}`}><TarotArt cardId={selected.cardId} orientation={selected.orientation} alt={`${position.label} · ${getTarotAsset(selected.cardId)?.nameKo ?? "선택한"} 카드`} eager /></span>
          </div> : isRevealed ? <TarotArt cardId={selected.cardId} orientation={selected.orientation} alt={`${position.label} · ${getTarotAsset(selected.cardId)?.nameKo ?? "선택한"} 카드`} /> : <CardBack />}
        </div>
        <p><b>{position.order}</b><span>{position.label}</span></p>
      </article>;
    })}
  </section>;
}

function RevealCard({ session, index, flipped, message }: { session: DestinyTarotSessionDraft; index: number; flipped: boolean; message?: string }) {
  const positions = [...(session.spreadPositions ?? [])].sort((left, right) => left.order - right.order);
  const position = positions[index];
  const selected = (session.selectedCards ?? []).find((card) => card.spreadPositionId === position?.id);
  const asset = selected ? getTarotAsset(selected.cardId) : undefined;
  if (!position || !selected) return null;
  return <section className={styles.revealFocus} aria-live="polite">
    <p className={styles.revealProgress}>{index + 1} / {positions.length}</p>
    <p className={styles.revealPosition}><b>{position.order}</b>{position.label}</p>
    <p className={styles.revealDescription}>{position.description}</p>
    <div className={`${styles.revealHeroFlip} ${flipped ? styles.revealHeroFlipped : ""}`}>
      <span className={`${styles.revealHeroFace} ${styles.revealHeroBack}`}><CardBack /></span>
      <span className={`${styles.revealHeroFace} ${styles.revealHeroFront}`}><TarotArt cardId={selected.cardId} orientation={selected.orientation} alt={`${asset?.nameKo ?? "선택한"} 카드`} eager /></span>
    </div>
    {flipped ? <div className={styles.revealCardCopy}>
      <h2>{asset?.nameKo ?? "선택한 카드"}</h2>
      <span>{orientationLabel(selected.orientation)}</span>
      <p>{message ?? "이 카드가 이 자리에서 전하는 이야기를 정리하고 있어요."}</p>
    </div> : <p className={styles.revealTurning} role="status">카드가 모습을 드러내고 있어요.</p>}
  </section>;
}

function DetailAccordion({ title, children }: { title: string; children: ReactNode }) {
  return <details className={styles.resultAccordion}>
    <summary>{title}<span aria-hidden="true">⌄</span></summary>
    <div>{children}</div>
  </details>;
}

function FinalResult({ session, reading, onRestart }: { session: DestinyTarotSessionDraft; reading: DestinyReadingResponse; onRestart: () => void }) {
  const profile = getDestinyReadingProfile(session.readingType);
  const positions = [...(session.spreadPositions ?? [])].sort((left, right) => left.order - right.order);
  const selectedByPosition = selectedCardsByPosition(session.selectedCards ?? []);
  const interpretations = new Map(reading.reading.positions.map((item) => [item.spreadPositionId, item.interpretation]));
  const conclusion = firstSentence(reading.reading.coreConclusion);
  return <main className={styles.page}>
    <section className={`${styles.surface} ${styles.finalResult}`} aria-labelledby="destiny-result-title">
      <p className={styles.eyebrow}>{profile.displayName} · YOUR READING</p>
      <h1 id="destiny-result-title">{profile.displayName}</h1>
      <p className={styles.resultConclusion}>{conclusion}</p>
      <section className={styles.resultSpreadSection} aria-label="완성된 스프레드"><p className={styles.eyebrow}>THE COMPLETED SPREAD</p><Spread session={session} revealedCount={positions.length} /></section>
      <section className={styles.resultDetails} aria-labelledby="destiny-position-details"><h2 id="destiny-position-details">자리별 상세 해석</h2>
        {positions.map((position) => {
          const selected = selectedByPosition.get(position.id);
          const asset = selected ? getTarotAsset(selected.cardId) : undefined;
          if (!selected) return null;
          return <article className={styles.positionReading} key={position.id}>
            <div className={styles.positionReadingHeading}><p><b>{position.order}</b>{position.label}</p><span>{position.description}</span></div>
            <div className={styles.positionReadingBody}><div className={styles.positionThumbnail}><TarotArt cardId={selected.cardId} orientation={selected.orientation} alt={`${asset?.nameKo ?? "선택한"} 카드`} /></div><div><h3>{asset?.nameKo ?? "선택한 카드"}</h3><em>{orientationLabel(selected.orientation)}</em></div></div>
            <p className={styles.positionInterpretation}>{interpretations.get(position.id)}</p>
          </article>;
        })}
      </section>
      <section className={styles.resultAccordions}>
        <DetailAccordion title="카드들이 함께 말하는 것"><p>{reading.reading.connections}</p></DetailAccordion>
        <DetailAccordion title="이번 리딩의 핵심"><p>{reading.reading.coreConclusion}</p></DetailAccordion>
        <DetailAccordion title="지금 나에게 필요한 방향"><p>{reading.reading.actionAdvice}</p></DetailAccordion>
      </section>
      <button className={`${styles.primaryButton} ${styles.resultRestart}`} type="button" onClick={onRestart}>새로운 고민으로 시작하기 <span>→</span></button>
    </section>
  </main>;
}

export function DestinyTarotReveal({ session, onRestart }: Props) {
  const [stage, setStage] = useState<RevealStage>("intro");
  const [revealIndex, setRevealIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>("idle");
  const [reading, setReading] = useState<DestinyReadingResponse | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [loadingTransitionComplete, setLoadingTransitionComplete] = useState(false);
  const input = useMemo(() => createDestinyReadingInput(session), [session]);
  const positions = useMemo(() => [...(session.spreadPositions ?? [])].sort((left, right) => left.order - right.order), [session.spreadPositions]);
  const cardImageSources = useMemo(() => positions.flatMap((position) => {
    const selected = (session.selectedCards ?? []).find((card) => card.spreadPositionId === position.id);
    const asset = selected ? getTarotAsset(selected.cardId) : undefined;
    return asset?.imageReady ? [asset.image] : [];
  }), [positions, session.selectedCards]);

  useEffect(() => {
    if (stage !== "intro" && stage !== "reveal") return;
    const firstIndex = stage === "intro" ? 0 : revealIndex;
    for (const source of cardImageSources.slice(firstIndex, firstIndex + 2)) {
      const { props } = getImageProps({ src: source, alt: "", fill: true, sizes: tarotArtSizes });
      const image = new window.Image();
      if (props.srcSet) image.srcset = props.srcSet;
      image.sizes = tarotArtSizes;
      image.src = props.src;
    }
  }, [cardImageSources, revealIndex, stage]);

  const requestReading = useCallback(async () => {
    if (!input) { setReadingStatus("error"); return; }
    setReadingStatus("loading");
    try {
      const response = await fetch("/api/destiny-tarot/reading", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const payload = await response.json() as { reading?: unknown };
      if (!response.ok || !isValidDestinyReading(payload.reading, input)) throw new Error("READING_UNAVAILABLE");
      setReading(payload.reading);
      setReadingStatus("success");
    } catch {
      setReadingStatus("error");
    }
  }, [input]);

  useEffect(() => {
    if (stage !== "reveal") return;
    setIsFlipped(false);
    const timer = window.setTimeout(() => setIsFlipped(true), 620);
    return () => window.clearTimeout(timer);
  }, [revealIndex, stage]);

  useEffect(() => {
    if (stage !== "loading") return;
    const messages = ["카드들의 흐름을 함께 읽고 있어요.", "각 카드가 서로 어떻게 이어지는지 살펴보고 있어요.", "당신의 질문에 필요한 메시지를 정리하고 있어요."];
    const timer = window.setInterval(() => setLoadingMessageIndex((index) => (index + 1) % messages.length), 1600);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "loading") {
      setLoadingTransitionComplete(false);
      return;
    }
    const timer = window.setTimeout(() => setLoadingTransitionComplete(true), 900);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage === "loading" && loadingTransitionComplete && readingStatus === "success" && reading) setStage("result");
  }, [loadingTransitionComplete, reading, readingStatus, stage]);

  const beginReveal = () => {
    setStage("reveal");
    setRevealIndex(0);
    void requestReading();
  };
  const nextCard = () => {
    if (revealIndex + 1 >= positions.length) setStage("complete");
    else setRevealIndex((index) => index + 1);
  };
  const openResult = () => {
    if (readingStatus !== "error") setStage("loading");
  };
  const useFallback = () => {
    if (!input) return;
    setReading(createFallbackDestinyReading(input));
    setReadingStatus("success");
    setStage("result");
  };

  if (!input || positions.length === 0) return <main className={styles.page}><section className={`${styles.surface} ${styles.revealRecovery}`}><p className={styles.eyebrow}>DESTINY TAROT</p><h1>리딩을 이어갈 카드 정보를 찾지 못했어요.</h1><p>선택한 카드가 유지되도록, 새 리딩에서 다시 천천히 시작해 주세요.</p><button className={styles.primaryButton} type="button" onClick={onRestart}>처음으로 <span>→</span></button></section></main>;
  if (stage === "result" && reading) return <FinalResult session={session} reading={reading} onRestart={onRestart} />;

  const currentPosition = positions[revealIndex];
  const currentMessage = reading?.revealMessages.find((item) => item.spreadPositionId === currentPosition?.id)?.message;
  const loadingMessages = ["카드들의 흐름을 함께 읽고 있어요.", "각 카드가 서로 어떻게 이어지는지 살펴보고 있어요.", "당신의 질문에 필요한 메시지를 정리하고 있어요."];
  const revealedCount = stage === "reveal" ? revealIndex + (isFlipped ? 1 : 0) : positions.length;

  return <main className={styles.page}>
    <section className={`${styles.surface} ${styles.revealPage}`} aria-live="polite">
      {stage === "intro" && <>
        <p className={styles.eyebrow}>THE CARDS ARE READY</p><h1>이제 카드가 전하는 이야기를<br />하나씩 확인해볼게요.</h1><p className={styles.revealIntroCopy}>각 카드는 당신의 질문 속에서 서로 다른 역할을 가지고 있어요.</p>
        <Spread session={session} revealedCount={0} />
        <button className={styles.primaryButton} type="button" onClick={beginReveal}>첫 번째 카드 보기 <span>→</span></button>
      </>}
      {stage === "reveal" && currentPosition && <>
        <Spread session={session} revealedCount={revealedCount} flippingPositionId={currentPosition.id} />
        <RevealCard session={session} index={revealIndex} flipped={isFlipped} message={currentMessage} />
        <button className={styles.primaryButton} type="button" disabled={!isFlipped} onClick={nextCard}>{revealIndex + 1 === positions.length ? "모든 카드 보기" : "다음 카드 보기"} <span>→</span></button>
      </>}
      {stage === "complete" && <>
        <p className={styles.eyebrow}>ALL CARDS REVEALED</p><h1>모든 카드가<br />모습을 드러냈어요.</h1><p className={styles.revealIntroCopy}>이제 카드들이 서로 어떤 이야기를 만들고 있는지 함께 살펴볼게요.</p>
        <Spread session={session} revealedCount={positions.length} />
        {readingStatus === "error" && <div className={styles.readingError} role="alert"><p>메시지를 불러오지 못했어요. 선택한 카드와 스프레드는 그대로 유지되어 있어요.</p><div><button type="button" onClick={() => void requestReading()}>다시 시도</button><button type="button" onClick={useFallback}>기본 메시지로 보기</button></div></div>}
        <button className={styles.primaryButton} type="button" disabled={readingStatus === "loading"} onClick={openResult}>{readingStatus === "loading" ? "리딩을 정리하고 있어요" : "전체 운명 리딩 보기"} <span>→</span></button>
      </>}
      {stage === "loading" && <section className={styles.destinyReadingLoading} aria-busy="true"><div className={styles.loadingMoon} aria-hidden="true">☾</div><p className={styles.eyebrow}>DESTINY READING</p><h1>카드들이 만든<br />흐름을 읽고 있어요.</h1><p>{loadingMessages[loadingMessageIndex]}</p><div className={styles.spreadLoadingStars} aria-hidden="true"><i /><i /><i /></div></section>}
    </section>
  </main>;
}
