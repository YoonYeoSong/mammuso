"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import styles from "./DestinyTarotExperience.module.css";
import { DestinyTarotReveal } from "./DestinyTarotReveal";
import { DestinySpreadSelection } from "./DestinySpreadSelection";
import { createDestinyDeckOrder, hasStableDestinyDeckOrder, normalizeDestinySpread } from "@/lib/destiny-tarot/spread";
import type { DestinyCardCount, DestinyChatReply, DestinyConversationMessage, DestinyOrientationMode, DestinyTarotSessionDraft } from "@/lib/destiny-tarot/types";
import { createProfileDestinySpread, getDestinyReadingProfile, type DestinyReadingType } from "@/lib/destiny-tarot/profiles";

type Phase = "intro" | "chat" | "review" | "orientation" | "cardCount" | "spreadLoading" | "spreadSelection" | "reveal";
type RecommendationStatus = "idle" | "loading" | "ready" | "unavailable";

const cardCountOptions: Array<{ count: DestinyCardCount; title: string; description: string; traits: string }> = [
  { count: 3, title: "3장 · 핵심 리딩", description: "질문의 핵심 흐름을 간결하게 살펴봐요.", traits: "빠름 · 핵심 중심 · 단순한 질문에 적합" },
  { count: 5, title: "5장 · 심층 리딩", description: "현재 상황과 여러 변수를 조금 더 깊게 살펴봐요.", traits: "균형 잡힌 깊이 · 선택/관계/고민에 적합" },
  { count: 10, title: "10장 · 전체 리딩", description: "질문을 둘러싼 전체 흐름과 세부적인 관계를 깊게 살펴봐요.", traits: "가장 깊은 리딩 · 복잡한 고민과 여러 변수에 적합" },
];

function createMessage(role: DestinyConversationMessage["role"], content: string, quickReplies?: string[]): DestinyConversationMessage {
  return { id: `${role}-${crypto.randomUUID()}`, role, content, quickReplies };
}

function formatAssistantReply(reply: DestinyChatReply) {
  return reply.status === "ASK"
    ? [reply.acknowledgement, reply.question].filter(Boolean).join("\n\n")
    : reply.assistantMessage;
}

function Avatar() {
  return <span className={styles.avatar} aria-hidden="true" />;
}

function CardGlyph({ reversed = false }: { reversed?: boolean }) {
  return <span className={`${styles.cardGlyph} ${reversed ? styles.cardGlyphReversed : ""}`} aria-hidden="true"><i>✦</i></span>;
}

export function DestinyTarotExperience({ readingType = "general" }: { readingType?: DestinyReadingType }) {
  const profile = getDestinyReadingProfile(readingType);
  const [phase, setPhase] = useState<Phase>("intro");
  const [conversation, setConversation] = useState<DestinyConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [session, setSession] = useState<DestinyTarotSessionDraft | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [recommendationStatus, setRecommendationStatus] = useState<RecommendationStatus>("idle");
  const [spreadLoadingMessage, setSpreadLoadingMessage] = useState("당신의 질문을 다시 살펴보고 있어요.");

  const canSend = draft.trim().length >= 2 && !isSending;
  const reviewQuestion = session?.finalQuestion ?? "";
  useEffect(() => {
    if (phase !== "spreadLoading") return;
    const messages = ["당신의 질문을 다시 살펴보고 있어요.", "카드가 놓일 자리를 정하고 있어요.", "당신만의 운명 스프레드를 준비하고 있어요."];
    let index = 0;
    setSpreadLoadingMessage(messages[index]);
    const interval = window.setInterval(() => { index = (index + 1) % messages.length; setSpreadLoadingMessage(messages[index]); }, 1300);
    return () => window.clearInterval(interval);
  }, [phase]);

  function loadCardCountRecommendation() {
    if (!session || recommendationStatus !== "idle") return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 7000);
    setRecommendationStatus("loading");
    void fetch("/api/destiny-tarot/card-count-recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readingType: session.readingType, summary: session.summary, finalQuestion: session.finalQuestion }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json() as { recommendation?: { recommendedCardCount?: unknown; reason?: unknown } };
        const recommendation = payload.recommendation;
        const recommendedCardCount = recommendation?.recommendedCardCount;
        const recommendationReason = recommendation?.reason;
        if (!response.ok || ![3, 5, 10].includes(recommendedCardCount as number) || typeof recommendationReason !== "string") {
          throw new Error("RECOMMENDATION_UNAVAILABLE");
        }
        setSession((current) => current ? {
          ...current,
          recommendedCardCount: recommendedCardCount as DestinyCardCount,
          recommendationReason,
        } : current);
        setRecommendationStatus("ready");
      })
      .catch(() => {
        setSession((current) => current ? { ...current, recommendedCardCount: null, recommendationReason: null } : current);
        setRecommendationStatus("unavailable");
      })
      .finally(() => window.clearTimeout(timeoutId));
  }

  function beginChat() {
    setConversation([createMessage("assistant", profile.greeting)]);
    setDraft("");
    setError("");
    setPhase("chat");
  }

  async function sendMessage(content = draft) {
    const trimmed = content.trim();
    if (trimmed.length < 2 || isSending) return;

    const userMessage = createMessage("user", trimmed);
    const nextConversation = [...conversation, userMessage];
    setConversation(nextConversation);
    setDraft("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/destiny-tarot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingType, conversation: nextConversation }),
      });
      const payload = await response.json() as { reply?: DestinyChatReply; message?: string };
      if (!response.ok || !payload.reply) throw new Error(payload.message ?? "대화를 이어가지 못했어요.");

      const reply = payload.reply;
      const assistantMessage = createMessage("assistant", formatAssistantReply(reply), reply.status === "ASK" ? reply.quickReplies : undefined);
      const completedConversation = [...nextConversation, assistantMessage];
      setConversation(completedConversation);

      if (reply.status === "READY") {
        setSession({
          readingType,
          originalConcern: nextConversation.find((message) => message.role === "user")?.content ?? trimmed,
          conversation: completedConversation,
          summary: reply.summary,
          concernSummary: reply.summary,
          finalQuestion: reply.finalQuestion,
          recommendedCardCount: null,
          recommendationReason: null,
          viewMode: "fan",
        });
        setRecommendationStatus("idle");
        setPhase("review");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "대화를 이어가지 못했어요. 다시 시도해주세요.");
    } finally {
      setIsSending(false);
    }
  }

  function selectOrientation(orientationMode: DestinyOrientationMode) {
    setSession((current) => current ? { ...current, orientationMode } : current);
  }

  function selectCardCount(cardCount: DestinyCardCount) {
    setSession((current) => current ? { ...current, cardCount } : current);
  }

  async function startSpread() {
    if (!session || !session.cardCount || !session.orientationMode || !session.finalQuestion.trim()) return;
    const cardCount = session.cardCount;
    const fallback = createProfileDestinySpread(session.readingType, session.finalQuestion, cardCount);
    setPhase("spreadLoading");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    let spread = fallback;
    try {
      const response = await fetch("/api/destiny-tarot/spread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingType: session.readingType, concernSummary: session.concernSummary || session.summary, finalQuestion: session.finalQuestion, cardCount }),
        signal: controller.signal,
      });
      const payload = await response.json() as { spread?: unknown };
      if (response.ok) spread = normalizeDestinySpread(payload.spread, cardCount, fallback);
    } catch {
      // The local fallback deliberately keeps the ritual moving when AI is unavailable.
    } finally {
      window.clearTimeout(timeoutId);
    }

    setSession((current) => current ? {
      ...current,
      spreadTemplate: spread.template,
      spreadPositions: spread.positions,
      deckOrder: hasStableDestinyDeckOrder(current.deckOrder) ? current.deckOrder : createDestinyDeckOrder(),
      selectedCards: current.selectedCards ?? [],
      viewMode: current.viewMode ?? "fan",
    } : current);
    setPhase("spreadSelection");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  if (phase === "intro") return <main className={styles.page}>
    <section className={`${styles.surface} ${styles.intro}`} aria-labelledby="destiny-intro-title">
      <Link className={styles.backLink} href="/">← 운명타로 홈</Link>
      <div className={styles.introSymbol} aria-hidden="true"><Avatar /></div>
      <p className={styles.eyebrow}>{profile.displayName} · DEEP READING</p>
      <h1 id="destiny-intro-title">{profile.displayName}로<br />마음속 이야기를<br />읽어볼까요?</h1>
      <p className={styles.introCopy}>{profile.description} {profile.chatGuide}</p>
      <button className={styles.primaryButton} type="button" onClick={beginChat}>이야기 시작하기 <span>→</span></button>
      <p className={styles.notice}>운명타로는 가벼운 재미와 자기성찰을 위한 리딩이에요.</p>
    </section>
  </main>;

  if (phase === "review" && session) return <main className={styles.page}>
    <section className={`${styles.surface} ${styles.review}`} aria-labelledby="destiny-review-title">
      <button className={styles.textButton} type="button" onClick={() => setPhase("chat")}>← 대화로 돌아가기</button>
      <div className={styles.reviewHeading}><Avatar /><div><p className={styles.eyebrow}>READY · YOUR QUESTION</p><h1 id="destiny-review-title">이렇게 고민을<br />정리해봤어요.</h1></div></div>
      <section className={styles.summaryCard} aria-label="고민 요약"><p>고민 요약</p><strong>{session.summary}</strong></section>
      <label className={styles.questionEditor}><span>이번에 살펴볼 질문</span><textarea value={reviewQuestion} onChange={(event) => {
        setSession((current) => current ? { ...current, finalQuestion: event.target.value, recommendedCardCount: null, recommendationReason: null } : current);
        setRecommendationStatus("idle");
      }} maxLength={300} aria-describedby="destiny-question-help" /></label>
      <p className={styles.editorHelp} id="destiny-question-help">그대로 사용하거나, 지금 마음에 더 맞는 표현으로 수정할 수 있어요.</p>
      <button className={styles.primaryButton} type="button" disabled={reviewQuestion.trim().length < 8} onClick={() => {
        setSession((current) => current ? { ...current, finalQuestion: current.finalQuestion.trim() } : current);
        setPhase("orientation");
      }}>이 질문으로 리딩 준비하기 <span>→</span></button>
    </section>
  </main>;

  if (phase === "orientation" && session) return <main className={styles.page}>
    <section className={`${styles.surface} ${styles.selection}`} aria-labelledby="destiny-orientation-title">
      <button className={styles.textButton} type="button" onClick={() => setPhase("review")}>← 질문으로 돌아가기</button>
      <p className={styles.step}>STEP 1 / 2</p>
      <p className={styles.eyebrow}>THE WAY THE CARDS SPEAK</p>
      <h1 id="destiny-orientation-title">카드의 방향을<br />선택해주세요</h1>
      <p className={styles.selectionLead}>카드를 어떤 방식으로 읽을지 선택할 수 있어요.</p>
      <div className={styles.optionStack} role="group" aria-label="카드 방향">
        <button className={`${styles.optionCard} ${session.orientationMode === "uprightOnly" ? styles.optionSelected : ""}`} type="button" onClick={() => selectOrientation("uprightOnly")} aria-pressed={session.orientationMode === "uprightOnly"}>
          <span className={styles.optionTop}><CardGlyph /><span><strong>정방향만</strong><small>모든 카드를 정방향으로 읽어요.</small></span><b className={styles.check}>✓</b></span>
          <span className={styles.optionDescription}>보다 단순하고 명확하게 카드의 기본 흐름을 살펴봅니다.</span>
        </button>
        <button className={`${styles.optionCard} ${session.orientationMode === "mixed" ? styles.optionSelected : ""}`} type="button" onClick={() => selectOrientation("mixed")} aria-pressed={session.orientationMode === "mixed"}>
          <span className={styles.optionTop}><span className={styles.pairedGlyphs}><CardGlyph /><CardGlyph reversed /></span><span><strong>정방향 + 역방향</strong><small>카드마다 방향이 무작위로 결정돼요.</small></span><b className={styles.check}>✓</b></span>
          <span className={styles.recommendBadge}>✦ 추천</span>
          <span className={styles.optionDescription}>조금 더 세밀하고 입체적으로 카드의 흐름을 살펴봅니다.</span>
          <span className={styles.orientationNote}>역방향이라고 해서 나쁜 의미라는 뜻은 아니에요.</span>
        </button>
      </div>
      <details className={styles.orientationInfo}><summary>정방향과 역방향은 어떻게 다른가요?</summary><p><strong>정방향</strong>은 카드의 기본적인 의미와 흐름이 비교적 직접적으로 나타납니다.</p><p><strong>역방향</strong>은 의미가 약해지거나 막혀 있거나, 내면에서 작용하거나 다른 방식으로 표현될 수 있어요. 역방향이 곧 나쁜 카드를 뜻하지는 않아요.</p></details>
      <button className={styles.primaryButton} type="button" disabled={!session.orientationMode} onClick={() => {
        setPhase("cardCount");
        loadCardCountRecommendation();
      }}>다음 <span>→</span></button>
    </section>
  </main>;

  if (phase === "cardCount" && session) return <main className={styles.page}>
    <section className={`${styles.surface} ${styles.selection}`} aria-labelledby="destiny-card-count-title">
      <button className={styles.textButton} type="button" onClick={() => setPhase("orientation")}>← 카드 방향으로 돌아가기</button>
      <p className={styles.step}>STEP 2 / 2</p>
      <p className={styles.eyebrow}>YOUR READING DEPTH</p>
      <h1 id="destiny-card-count-title">몇 장의 카드로<br />살펴볼까요?</h1>
      <p className={styles.selectionLead}>카드가 많을수록 질문의 흐름을 더 여러 각도에서 살펴볼 수 있어요.</p>
      {recommendationStatus === "loading" && <div className={styles.recommendationLoading} role="status"><i /><span>당신의 질문에 어울리는<br />리딩 깊이를 살펴보고 있어요.</span></div>}
      <div className={styles.countOptionStack} role="group" aria-label="카드 장수">
        {cardCountOptions.map((option) => {
          const isRecommended = session.recommendedCardCount === option.count;
          const isSelected = session.cardCount === option.count;
          return <button className={`${styles.countOption} ${isSelected ? styles.optionSelected : ""} ${isRecommended ? styles.recommendedOption : ""}`} type="button" key={option.count} onClick={() => selectCardCount(option.count)} aria-pressed={isSelected}>
            <span className={styles.countOptionHeader}><strong>{option.title}</strong>{isRecommended && <em>✦ 추천</em>}<b className={styles.check}>✓</b></span>
            <span className={styles.countDescription}>{option.description}</span>
            <span className={styles.countTraits}>{option.traits}</span>
            {isRecommended && session.recommendationReason && <span className={styles.recommendationReason}><b>AI 추천</b>{session.recommendationReason}</span>}
          </button>;
        })}
      </div>
      {recommendationStatus === "unavailable" && <p className={styles.recommendationFallback}>추천을 준비하지 못했어요. 원하시는 리딩 깊이를 직접 선택해주세요.</p>}
      <button className={styles.primaryButton} type="button" disabled={!session.cardCount} onClick={() => void startSpread()}>운명 스프레드 만들기 <span>→</span></button>
    </section>
  </main>;

  if (phase === "spreadLoading" && session) return <main className={styles.page}>
    <section className={`${styles.surface} ${styles.spreadPreparation}`} aria-labelledby="destiny-preparation-title" aria-live="polite" aria-busy="true">
      <Avatar />
      <p className={styles.eyebrow}>DESTINY SPREAD</p>
      <h1 id="destiny-preparation-title">당신의 질문에 맞는<br />카드의 자리를<br />만들고 있어요.</h1>
      <p className={styles.confirmedQuestion}>“{session.finalQuestion}”</p>
      <p className={styles.preparationMeta}>{spreadLoadingMessage}</p>
      <div className={styles.spreadLoadingStars} aria-hidden="true"><i /><i /><i /></div>
    </section>
  </main>;

  if (phase === "spreadSelection" && session?.spreadPositions && session.deckOrder) return <DestinySpreadSelection session={session} setSession={setSession} onMessageCheck={() => setPhase("reveal")} />;

  if (phase === "reveal" && session) return <DestinyTarotReveal session={session} onRestart={() => {
    setSession(null);
    setConversation([]);
    setDraft("");
    setError("");
    setRecommendationStatus("idle");
    setPhase("intro");
  }} />;

  return <main className={styles.page}>
    <section className={`${styles.surface} ${styles.chat}`} aria-labelledby="destiny-chat-title">
      <header className={styles.chatHeader}><button className={styles.textButton} type="button" onClick={() => setPhase("intro")}>← 처음으로</button><div><Avatar /><span id="destiny-chat-title">{profile.guideName}</span></div></header>
      <p className={styles.chatGuide}>{profile.chatGuide}</p>
      <div className={styles.messages} aria-live="polite">
        {conversation.map((message) => <div className={`${styles.messageRow} ${message.role === "user" ? styles.userRow : styles.assistantRow}`} key={message.id}>
          {message.role === "assistant" && <Avatar />}
          <div>
            {message.role === "assistant" && <span className={styles.sender}>{profile.guideName}</span>}
            <p className={`${styles.bubble} ${message.role === "user" ? styles.userBubble : styles.assistantBubble}`}>{message.content}</p>
            {message.role === "assistant" && message.quickReplies && <div className={styles.quickReplies}>{message.quickReplies.map((reply) => <button key={reply} type="button" onClick={() => void sendMessage(reply)} disabled={isSending}>{reply}</button>)}</div>}
          </div>
        </div>)}
        {isSending && <div className={`${styles.messageRow} ${styles.assistantRow}`}><Avatar /><p className={`${styles.bubble} ${styles.assistantBubble} ${styles.thinking}`}><i /><i /><i /><span className="sr-only">답변을 생각하는 중</span></p></div>}
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <form className={styles.composer} onSubmit={submit}>
        <label className="sr-only" htmlFor="destiny-chat-input">고민 입력</label>
        <textarea id="destiny-chat-input" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={submitOnEnter} placeholder="지금 마음에 걸리는 이야기를 적어주세요." maxLength={600} rows={3} disabled={isSending} />
        <div><small>Enter로 보내기 · Shift + Enter 줄바꿈</small><button type="submit" disabled={!canSend}>보내기 <span>↑</span></button></div>
      </form>
    </section>
  </main>;
}
