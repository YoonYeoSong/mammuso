"use client";

import { useEffect, useMemo, useState } from "react";
import type { TarotReading } from "@/lib/ai/provider";
import { majorArcana, tarotCategories, type TarotCard, type TarotCategory } from "@/lib/tarot/cards";

type Phase = "question" | "love-chat" | "shuffling" | "picking" | "confirming" | "revealing" | "loading" | "reading";
type ViewMode = "fan" | "grid";
type LoveSituation = "솔로" | "연애 중" | "기혼";
const positions = ["지금의 마음", "나를 스치는 것", "다가오는 흐름"];
const loveSituations: LoveSituation[] = ["솔로", "연애 중", "기혼"];

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
  const [selectedSlots, setSelectedSlots] = useState<Array<string | null>>([null, null, null]);
  const [viewMode, setViewMode] = useState<ViewMode>("fan");
  const [isSelectionConfirmOpen, setIsSelectionConfirmOpen] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [loveSituation, setLoveSituation] = useState<LoveSituation | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [reading, setReading] = useState<TarotReading | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("세 장이 만든 흐름을 천천히 이어보고 있어.");
  const [readingError, setReadingError] = useState("");
  const selectedIds = useMemo(() => selectedSlots.filter((id): id is string => id !== null), [selectedSlots]);
  const selectedCards = useMemo(() => selectedIds.map((id) => deck.find((card) => card.id === id)).filter((card): card is TarotCard => Boolean(card)), [deck, selectedIds]);

  useEffect(() => {
    if (phase !== "shuffling") return;
    const timer = window.setTimeout(() => setPhase("picking"), 1500);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function startShuffle() {
    setDeck(shuffle(majorArcana));
    setSelectedSlots([null, null, null]);
    setIsSelectionConfirmOpen(false);
    setReturningId(null);
    setRevealed(0);
    setReading(null);
    setReadingError("");
    setPhase("shuffling");
  }

  function beginLoveChat() {
    setLoveSituation(null);
    setPhase("love-chat");
  }

  function selectLoveSituation(situation: LoveSituation) {
    setLoveSituation(situation);
  }

  function addCardToOpenSlot(id: string) {
    setSelectedSlots((current) => {
      if (current.includes(id)) return current;
      const openSlot = current.findIndex((cardId) => cardId === null);
      return openSlot === -1 ? current : current.map((cardId, index) => index === openSlot ? id : cardId);
    });
  }

  function chooseFanCard(id: string) {
    addCardToOpenSlot(id);
  }

  function removeSelectedCard(id: string) {
    if (viewMode !== "fan") {
      setSelectedSlots((current) => current.map((cardId) => cardId === id ? null : cardId));
      return;
    }
    if (returningId) return;
    setReturningId(id);
    window.setTimeout(() => {
      setSelectedSlots((current) => current.map((cardId) => cardId === id ? null : cardId));
      setReturningId(null);
    }, 280);
  }

  async function getReading() {
    setReadingError("");
    setPhase("loading");
    const messages = [
      "세 장이 만든 흐름을 천천히 이어보고 있어.",
      "조금 더 시간이 걸리고 있어. 해석을 다시 이어서 읽어볼게.",
      "죄송해요, 연결이 잠시 늦어지고 있어. 한 번 더 차분히 불러오는 중이야.",
    ];

    for (let attempt = 0; attempt < messages.length; attempt += 1) {
      setLoadingMessage(messages[attempt]);
      try {
        const contextualQuestion = category === "연애" && loveSituation
          ? [`현재 상황: ${loveSituation}`, `사용자 질문: ${question.trim()}`].join("\n")
          : question;
        const response = await fetch("/api/tarot/reading", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, question: contextualQuestion, cardIds: selectedIds }) });
        const result = await response.json() as { reading?: TarotReading; error?: string };
        if (!response.ok || !result.reading) throw new Error(result.error ?? "reading failed");
        setReading(result.reading);
        setPhase("reading");
        return;
      } catch {
        if (attempt < messages.length - 1) await new Promise((resolve) => window.setTimeout(resolve, 1200 * (attempt + 1)));
      }
    }

    setLoadingMessage("죄송해요, 지금은 해석을 끝까지 가져오지 못했어. 이 화면에서 바로 다시 이어서 시도할 수 있어.");
    setReadingError("응답이 평소보다 오래 걸리고 있어요.");
  }

  if (phase === "question") return <section className="tarot-shell question-screen">
    <p className="step">TAROT · 3 CARDS</p>
    <h1>오늘 뭐가<br />궁금해?</h1>
    <p className="tarot-intro">답을 정해두지 않아도 돼. 마음이 가는 주제부터 골라봐.</p>
    <div className="category-grid" role="group" aria-label="타로 주제">
      {tarotCategories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => { if (category !== item) setQuestion(""); setCategory(item); }}>{item}</button>)}
    </div>
    <label className="question-input"><span>{category}에서 무엇이 궁금해?</span><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={category === "연애" ? "예: 나는 언제쯤 결혼할까?" : category === "돈" ? "예: 올해 돈 흐름은 어떨까?" : `${category}에서 궁금한 걸 구체적으로 적어줘.`} maxLength={280} /></label>
    <button className="primary-action" onClick={category === "연애" ? beginLoveChat : startShuffle} disabled={question.trim().length < 2}>{category === "연애" ? "다음" : "카드 뽑으러 가기"} <span>→</span></button>
    <p className="gentle-note">가벼운 재미와 생각 정리를 위한 타로예요.</p>
  </section>;

  if (phase === "love-chat") return <section className="tarot-shell love-chat-screen" aria-label="연애 타로 대화">
    <p className="step">연애 타로 · 짧은 대화</p>
    <div className="chat-thread" aria-live="polite">
      <div className="chat-message bot"><span>mammuso</span><p>연애에서 어떤 게 궁금해?</p></div>
      <div className="chat-message user"><p>{question.trim()}</p></div>
      <div className="chat-message bot"><span>mammuso</span><p>답을 더 잘 읽으려면, 지금 어떤 상태인지 골라줘.</p></div>
      {!loveSituation && <div className="chat-options" role="group" aria-label="현재 연애 상태">
        {loveSituations.map((situation) => <button key={situation} type="button" onClick={() => selectLoveSituation(situation)}>{situation}</button>)}
      </div>}
      {loveSituation && <>
        <div className="chat-message user"><p>{loveSituation}</p></div>
        <div className="chat-message bot final"><span>mammuso</span><p>좋아. 그 질문을 마음에 두고 카드를 섞어볼게.</p></div>
      </>}
    </div>
    <button className="primary-action" onClick={startShuffle} disabled={!loveSituation}>타로 보러 가자 <span>→</span></button>
    <button type="button" className="chat-back" onClick={() => setPhase("question")}>주제 다시 고르기</button>
  </section>;

  if (phase === "shuffling") return <section className="tarot-shell ritual-screen" aria-live="polite">
    <p className="step">카드를 섞는 중</p>
    <div className="shuffle-deck" aria-hidden="true"><span /><span /><span /><span /></div>
    <h1>스슥,<br />마음을 섞어볼게.</h1>
    <p>질문을 마음속으로 한 번 생각해봐.</p>
  </section>;

  if (phase === "picking") return <section className="tarot-shell pick-screen">
    <div className="pick-heading"><div><p className="step">카드 선택</p><h1>끌리는 카드<br />3장을 골라줘.</h1></div><strong>{selectedIds.length} <small>/ 3</small></strong></div>
    <p className="pick-copy">선택 완료 전에는 언제든 다시 골라봐.</p>
    <p className="view-mode-label">보기 형식</p>
    <div className="draw-test-switch" role="group" aria-label="카드 보기 형식">
      <button type="button" className={viewMode === "fan" ? "active" : ""} onClick={() => setViewMode("fan")}><span className="test-card-icon" aria-hidden="true">1</span><span><b>부채꼴</b><small>게임처럼 한 장씩 뽑기</small></span></button>
      <button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}><span className="test-card-icon" aria-hidden="true">2</span><span><b>정렬형</b><small>한눈에 보고 고르기</small></span></button>
    </div>
    <div className="draw-slots" aria-label="뽑은 카드">
      {[0, 1, 2].map((index) => {
        const selectedId = selectedSlots[index];
        const card = selectedId ? deck.find((deckCard) => deckCard.id === selectedId) : undefined;
        return card ? <button key={card.id} type="button" className={`draw-slot selected ${returningId === card.id ? "is-returning" : ""}`} onClick={() => removeSelectedCard(card.id)} aria-label={`${index + 1}번째 뽑은 카드, 다시 고르기`}><CardFace card={card} revealed={false} /><span>{index + 1} · 다시 고르기</span></button> : <div className="draw-slot empty" key={index}><b>{index + 1}</b><small>비어 있음</small></div>;
      })}
    </div>
    {viewMode === "fan" ? <div className="fan-wrap" aria-label="22장 타로 카드">
      <p className="fan-help">끌리는 카드를 바로 뽑아봐.</p>
      <div className="card-fan">
        {deck.map((card, index) => {
          const selectIndex = selectedSlots.indexOf(card.id);
          const degree = (index - (deck.length - 1) / 2) * 4.05;
          const shift = Math.abs(index - (deck.length - 1) / 2) * 1.25;
          return <button key={card.id} type="button" className={`fan-card ${selectIndex >= 0 ? "is-picked" : ""}`} style={{ "--i": index, "--r": `${degree}deg`, "--y": `${shift}px` } as React.CSSProperties} onClick={() => chooseFanCard(card.id)} disabled={selectIndex >= 0} aria-label={`카드 ${index + 1}${selectIndex >= 0 ? `, ${selectIndex + 1}번 선택됨` : ""}`}><CardFace card={card} revealed={false} /></button>;
        })}
      </div>
    </div> : <div className="deck-grid" aria-label="22장 타로 카드">
      {deck.map((card, index) => {
        const selectIndex = selectedSlots.indexOf(card.id);
        return <button key={card.id} type="button" className={`deck-grid-card ${selectIndex >= 0 ? "is-picked" : ""}`} onClick={() => addCardToOpenSlot(card.id)} disabled={selectIndex >= 0} aria-label={`카드 ${index + 1}${selectIndex >= 0 ? `, ${selectIndex + 1}번 선택됨` : ""}`}><CardFace card={card} revealed={false} />{selectIndex >= 0 && <span className="selection-index" aria-hidden="true">{selectIndex + 1}</span>}</button>;
      })}
    </div>}
    <div className="selection-bar"><span>{selectedIds.length === 3 ? "마음이 정해졌다면" : "카드를 고르는 중"}</span><button className="primary-action" onClick={() => setIsSelectionConfirmOpen(true)} disabled={selectedIds.length !== 3}>이 카드로 볼게 <span>→</span></button></div>
    {isSelectionConfirmOpen && <div className="selection-confirm" role="dialog" aria-modal="true" aria-labelledby="selection-confirm-title"><div><p className="step">마지막 확인</p><h2 id="selection-confirm-title">이 세 장으로<br />정말 볼까?</h2><p>확인하면 카드 공개와 해석으로 이어져.</p><div><button type="button" className="secondary-action" onClick={() => setIsSelectionConfirmOpen(false)}>다시 고르기</button><button type="button" className="confirm-action" onClick={() => { setIsSelectionConfirmOpen(false); setPhase("confirming"); }}>응, 이 카드로 볼게</button></div></div></div>}
  </section>;

  if (phase === "confirming") return <section className="tarot-shell ritual-screen confirm-screen">
    <p className="step">선택 완료</p><h1>세 장이<br />앞에 놓였어.</h1><p>천천히, 한 장씩 열어봐.</p>
    <div className="chosen-row">{selectedCards.map((card) => <CardFace key={card.id} card={card} revealed={false} />)}</div>
    <button className="primary-action" onClick={() => setPhase("revealing")}>첫 번째 카드를 열어봐 <span>→</span></button>
  </section>;

  if (phase === "loading") return <section className="tarot-shell ritual-screen reading-loading" aria-live="polite" aria-busy="true">
    <p className="step">AI READING</p>
    <div className="reading-loader" aria-hidden="true"><span /><span /><span /></div>
    <h1>{readingError ? "조금만 더\n기다려줘." : "카드의 이야기를\n읽고 있어."}</h1>
    <p>{loadingMessage}</p>
    <div className="loader-dots" aria-hidden="true"><i /><i /><i /></div>
    {readingError ? <button type="button" className="loading-retry" onClick={getReading}>해석 다시 이어서 보기 <span>→</span></button> : <small>조금만 기다려줘.</small>}
  </section>;

  if (phase === "revealing") return <section className="tarot-shell reveal-screen">
    <p className="step">카드 공개 · {revealed} / 3</p>
    <h1>{revealed === 0 ? "첫 번째 카드를\n열어봐." : revealed < 3 ? "다음 카드도\n열어볼까?" : "세 장이 모두\n열렸어."}</h1>
    <div className="reveal-row">
      {selectedCards.map((card, index) => <button key={card.id} className={`reveal-card ${index < revealed ? "open" : ""}`} onClick={() => index === revealed && setRevealed((count) => Math.min(count + 1, 3))} disabled={index !== revealed} aria-label={`${positions[index]} 카드 ${index < revealed ? "공개됨" : "공개하기"}`}><CardFace card={card} revealed={index < revealed} label={index < revealed ? positions[index] : undefined} /></button>)}
    </div>
    {revealed === 3 && <div className="reading-cta"><p>카드가 전하는 흐름을 AI와 함께 읽어볼게.</p><button className="primary-action" onClick={getReading}>이 카드들, 무슨 뜻일까? <span>→</span></button></div>}
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
