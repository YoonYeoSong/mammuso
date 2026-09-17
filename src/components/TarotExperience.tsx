"use client";

import { useEffect, useMemo, useState } from "react";
import type { TarotReading } from "@/lib/ai/provider";
import { majorArcana, tarotCategories, type TarotCard, type TarotCategory } from "@/lib/tarot/cards";

type Phase = "question" | "shuffling" | "picking" | "confirming" | "revealing" | "loading" | "reading";
type DrawTestMode = "direct" | "preview";
const positions = ["지금의 마음", "나를 스치는 것", "다가오는 흐름"];

function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function CardFace({ card, revealed, label }: { card: TarotCard; revealed: boolean; label?: string }) {
  return <div className={`tarot-card ${revealed ? "is-revealed" : ""}`}>
    <div className="tarot-card-inner">
      <div className="tarot-card-back" aria-hidden={revealed} />
      <div className="tarot-card-front" aria-hidden={!revealed}>
        <span className="tarot-card-number">{String(card.number).padStart(2, "0")}</span>
        <span className="tarot-card-symbol">{card.symbol}</span>
        <span className="tarot-card-name">{card.name}</span>
        <span className="tarot-card-tone">{card.tone}</span>
      </div>
    </div>
    {label && <span className="tarot-card-label">{label}</span>}
  </div>;
}

export function TarotExperience() {
  const [phase, setPhase] = useState<Phase>("question");
  const [category, setCategory] = useState<TarotCategory>("연애");
  const [question, setQuestion] = useState("");
  const [deck, setDeck] = useState<TarotCard[]>(majorArcana);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawTestMode, setDrawTestMode] = useState<DrawTestMode>("preview");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [fanOffset, setFanOffset] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [reading, setReading] = useState<TarotReading | null>(null);
  const [error, setError] = useState("");
  const selectedCards = useMemo(() => selectedIds.map((id) => deck.find((card) => card.id === id)).filter((card): card is TarotCard => Boolean(card)), [deck, selectedIds]);

  useEffect(() => {
    if (phase !== "shuffling") return;
    const timer = window.setTimeout(() => setPhase("picking"), 1500);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function startShuffle() {
    setDeck(shuffle(majorArcana));
    setSelectedIds([]);
    setPendingId(null);
    setFanOffset(0);
    setRevealed(0);
    setReading(null);
    setError("");
    setPhase("shuffling");
  }

  function toggleCard(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((cardId) => cardId !== id) : current.length < 3 ? [...current, id] : current);
  }

  function chooseFanCard(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds((current) => current.filter((cardId) => cardId !== id));
      return;
    }
    if (selectedIds.length >= 3) return;
    if (drawTestMode === "direct") {
      setSelectedIds((current) => [...current, id]);
      return;
    }
    setPendingId(id);
  }

  function confirmPendingCard() {
    if (!pendingId || selectedIds.length >= 3) return;
    setSelectedIds((current) => current.includes(pendingId) ? current : [...current, pendingId]);
    setPendingId(null);
  }

  async function getReading() {
    setError("");
    setPhase("loading");
    try {
      const response = await fetch("/api/tarot/reading", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, question, cardIds: selectedIds }) });
      const result = await response.json() as { reading?: TarotReading; error?: string };
      if (!response.ok || !result.reading) {
        if (result.error === "AI_NOT_CONFIGURED") throw new Error("AI_NOT_CONFIGURED");
        throw new Error("reading failed");
      }
      setReading(result.reading);
      setPhase("reading");
    } catch (requestError) {
      setError(requestError instanceof Error && requestError.message === "AI_NOT_CONFIGURED" ? "AI 해석 연결이 아직 준비되지 않았어요. 잠시 후 다시 눌러봐." : "해석을 불러오지 못했어요. 잠시 후 다시 눌러봐.");
      setPhase("revealing");
    }
  }

  if (phase === "question") return <section className="tarot-shell question-screen">
    <p className="step">TAROT · 3 CARDS</p>
    <h1>오늘 뭐가<br />궁금해?</h1>
    <p className="tarot-intro">답을 정해두지 않아도 돼. 마음이 가는 주제부터 골라봐.</p>
    <div className="category-grid" role="group" aria-label="타로 주제">
      {tarotCategories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
    </div>
    {category === "직접 질문" && <label className="question-input"><span>질문을 적어줘</span><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="예: 그 사람한테 다시 연락이 올까?" maxLength={280} /></label>}
    {category !== "직접 질문" && <label className="question-input optional"><span>조금 더 구체적으로 생각나는 게 있다면</span><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={`${category}에 대해 마음속으로 떠올린 질문을 적어도 좋아.`} maxLength={280} /></label>}
    <button className="primary-action" onClick={startShuffle} disabled={category === "직접 질문" && question.trim().length < 2}>카드 뽑으러 가기 <span>→</span></button>
    <p className="gentle-note">가벼운 재미와 생각 정리를 위한 타로예요.</p>
  </section>;

  if (phase === "shuffling") return <section className="tarot-shell ritual-screen" aria-live="polite">
    <p className="step">카드를 섞는 중</p>
    <div className="shuffle-deck" aria-hidden="true"><span /><span /><span /><span /></div>
    <h1>스슥,<br />마음을 섞어볼게.</h1>
    <p>질문을 마음속으로 한 번 생각해봐.</p>
  </section>;

  if (phase === "picking") return <section className="tarot-shell pick-screen">
    <div className="pick-heading"><div><p className="step">카드 선택</p><h1>끌리는 카드<br />3장을 골라줘.</h1></div><strong>{selectedIds.length} <small>/ 3</small></strong></div>
    <p className="pick-copy">테스트 방식은 바꿀 수 있어. 선택 완료 전에는 언제든 다시 골라봐.</p>
    <div className="draw-test-switch" role="group" aria-label="카드 뽑기 테스트 방식">
      <button type="button" className={drawTestMode === "direct" ? "active" : ""} onClick={() => { setDrawTestMode("direct"); setPendingId(null); }}><span className="test-card-icon" aria-hidden="true">1</span><span><b>테스트 1</b><small>바로 뽑기</small></span></button>
      <button type="button" className={drawTestMode === "preview" ? "active" : ""} onClick={() => { setDrawTestMode("preview"); setPendingId(null); }}><span className="test-card-icon" aria-hidden="true">2</span><span><b>테스트 2</b><small>미리 보고 뽑기</small></span></button>
    </div>
    <div className="draw-slots" aria-label="뽑은 카드">
      {[0, 1, 2].map((index) => {
        const card = selectedCards[index];
        return card ? <button key={card.id} type="button" className="draw-slot selected" onClick={() => setSelectedIds((current) => current.filter((cardId) => cardId !== card.id))} aria-label={`${index + 1}번째 뽑은 카드, 다시 고르기`}><CardFace card={card} revealed={false} /><span>{index + 1} · 다시 고르기</span></button> : <div className="draw-slot empty" key={index}><b>{index + 1}</b><small>비어 있음</small></div>;
      })}
    </div>
    <div className="fan-wrap" aria-label="22장 타로 카드">
      <button className="fan-nav fan-nav-left" type="button" onClick={() => setFanOffset((offset) => Math.min(offset + 150, 300))} disabled={fanOffset >= 300} aria-label="왼쪽 끝 카드 보기">←</button>
      <button className="fan-nav fan-nav-right" type="button" onClick={() => setFanOffset((offset) => Math.max(offset - 150, -300))} disabled={fanOffset <= -300} aria-label="오른쪽 끝 카드 보기">→</button>
      <p className="fan-help">{drawTestMode === "preview" ? "카드를 누르면 먼저 미리 볼 수 있어." : "끌리는 카드를 바로 뽑아봐."}</p>
      <div className="card-fan" style={{ "--fan-offset": `${fanOffset}px` } as React.CSSProperties}>
        {deck.map((card, index) => {
          const selectIndex = selectedIds.indexOf(card.id);
          const isPending = pendingId === card.id;
          const degree = (index - (deck.length - 1) / 2) * 4.05;
          const shift = Math.abs(index - (deck.length - 1) / 2) * 1.25;
          return <button key={card.id} type="button" className={`fan-card ${selectIndex >= 0 ? "is-selected" : ""} ${isPending ? "is-preview" : ""}`} style={{ "--i": index, "--r": `${degree}deg`, "--y": `${shift}px` } as React.CSSProperties} onClick={() => chooseFanCard(card.id)} aria-label={`카드 ${index + 1}${selectIndex >= 0 ? ", 선택됨" : isPending ? ", 미리보기 중" : ""}`}><CardFace card={card} revealed={false} /></button>;
        })}
      </div>
    </div>
    {pendingId && <div className="draw-preview" aria-live="polite"><span aria-hidden="true">✦</span><div><b>이 카드가 맞아?</b><small>다른 카드를 누르면 미리보기가 바뀌어.</small></div><button type="button" onClick={() => setPendingId(null)}>다시 고르기</button><button type="button" onClick={confirmPendingCard}>이 카드로 뽑기</button></div>}
    <div className="selection-bar"><span>{pendingId ? "미리보기를 확인해줘" : selectedIds.length === 3 ? "마음이 정해졌다면" : "카드를 고르는 중"}</span><button className="primary-action" onClick={() => setPhase("confirming")} disabled={selectedIds.length !== 3 || Boolean(pendingId)}>이 카드로 볼게 <span>→</span></button></div>
  </section>;

  if (phase === "confirming") return <section className="tarot-shell ritual-screen confirm-screen">
    <p className="step">선택 완료</p><h1>세 장이<br />앞에 놓였어.</h1><p>천천히, 한 장씩 열어봐.</p>
    <div className="chosen-row">{selectedCards.map((card) => <CardFace key={card.id} card={card} revealed={false} />)}</div>
    <button className="primary-action" onClick={() => setPhase("revealing")}>첫 번째 카드를 열어봐 <span>→</span></button>
  </section>;

  if (phase === "loading") return <section className="tarot-shell ritual-screen reading-loading" aria-live="polite" aria-busy="true">
    <p className="step">AI READING</p>
    <div className="reading-loader" aria-hidden="true"><span /><span /><span /></div>
    <h1>카드의 이야기를<br />읽고 있어.</h1>
    <p>세 장이 만든 흐름을 천천히 이어보고 있어.</p>
    <div className="loader-dots" aria-hidden="true"><i /><i /><i /></div>
    <small>조금만 기다려줘.</small>
  </section>;

  if (phase === "revealing") return <section className="tarot-shell reveal-screen">
    <p className="step">카드 공개 · {revealed} / 3</p>
    <h1>{revealed === 0 ? "첫 번째 카드를\n열어봐." : revealed < 3 ? "다음 카드도\n열어볼까?" : "세 장이 모두\n열렸어."}</h1>
    <div className="reveal-row">
      {selectedCards.map((card, index) => <button key={card.id} className={`reveal-card ${index < revealed ? "open" : ""}`} onClick={() => index === revealed && setRevealed((count) => Math.min(count + 1, 3))} disabled={index !== revealed} aria-label={`${positions[index]} 카드 ${index < revealed ? "공개됨" : "공개하기"}`}><CardFace card={card} revealed={index < revealed} label={index < revealed ? positions[index] : undefined} /></button>)}
    </div>
    {revealed === 3 && <div className="reading-cta"><p>카드가 전하는 흐름을 AI와 함께 읽어볼게.</p><button className="primary-action" onClick={getReading}>이 카드들, 무슨 뜻일까? <span>→</span></button>{error && <p className="request-error">{error}</p>}</div>}
  </section>;

  return <section className="tarot-shell result-screen">
    <p className="step">{category} · 오늘의 3장</p>
    <h1>{reading?.headline}</h1>
    <p className="result-opening">{reading?.opening}</p>
    <div className="result-cards">{selectedCards.map((card, index) => <article key={card.id} className="reading-card"><CardFace card={card} revealed label={positions[index]} /><div><p className="reading-position">{reading?.cardReadings[index]?.title}</p><p>{reading?.cardReadings[index]?.meaning}</p></div></article>)}</div>
    <section className="takeaway"><p className="step">한 줄로 보면</p><h2>{reading?.takeaway}</h2><div><span>오늘의 작은 행동</span><b>{reading?.tinyAction}</b></div></section>
    <div className="full-deck-tease"><span>78장으로 더 깊게 보기</span><small>COMING SOON</small></div>
    <button className="restart" onClick={() => setPhase("question")}>다른 질문 해보기</button>
    <p className="gentle-note">이 결과는 가벼운 재미와 자기성찰을 위한 콘텐츠예요.</p>
  </section>;
}
