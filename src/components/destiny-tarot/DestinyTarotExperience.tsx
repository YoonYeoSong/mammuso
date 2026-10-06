"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import styles from "./DestinyTarotExperience.module.css";
import type { DestinyChatReply, DestinyConversationMessage, DestinyTarotSessionDraft } from "@/lib/destiny-tarot/types";

type Phase = "intro" | "chat" | "review" | "confirmed";

const welcomeMessage = "지금 가장 마음에 걸리는 이야기를 들려주세요. 서두르지 않아도 괜찮아요.";

function createMessage(role: DestinyConversationMessage["role"], content: string, quickReplies?: string[]): DestinyConversationMessage {
  return { id: `${role}-${crypto.randomUUID()}`, role, content, quickReplies };
}

function Avatar() {
  return <span className={styles.avatar} aria-hidden="true" />;
}

export function DestinyTarotExperience() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [conversation, setConversation] = useState<DestinyConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [session, setSession] = useState<DestinyTarotSessionDraft | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const canSend = draft.trim().length >= 2 && !isSending;
  const reviewQuestion = session?.finalQuestion ?? "";
  const currentFollowUp = useMemo(() => Math.max(0, conversation.filter((message) => message.role === "user").length - 1), [conversation]);

  function beginChat() {
    setConversation([createMessage("assistant", welcomeMessage)]);
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
        body: JSON.stringify({ conversation: nextConversation }),
      });
      const payload = await response.json() as { reply?: DestinyChatReply; message?: string };
      if (!response.ok || !payload.reply) throw new Error(payload.message ?? "대화를 이어가지 못했어요.");

      const reply = payload.reply;
      const assistantMessage = createMessage("assistant", reply.assistantMessage, reply.status === "ASK" ? reply.quickReplies : undefined);
      const completedConversation = [...nextConversation, assistantMessage];
      setConversation(completedConversation);

      if (reply.status === "READY") {
        setSession({
          originalConcern: nextConversation.find((message) => message.role === "user")?.content ?? trimmed,
          conversation: completedConversation,
          summary: reply.summary,
          finalQuestion: reply.finalQuestion,
          viewMode: "fan",
        });
        setPhase("review");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "대화를 이어가지 못했어요. 다시 시도해주세요.");
    } finally {
      setIsSending(false);
    }
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
      <p className={styles.eyebrow}>DESTINY TAROT · DEEP READING</p>
      <h1 id="destiny-intro-title">마음속 이야기를<br />카드와 함께<br />천천히 읽어볼까요?</h1>
      <p className={styles.introCopy}>당신의 고민을 들은 뒤, 필요한 만큼만 함께 질문을 정리하고 그 마음에 맞는 타로 리딩을 준비해요.</p>
      <button className={styles.primaryButton} type="button" onClick={beginChat}>이야기 시작하기 <span>→</span></button>
      <p className={styles.notice}>운명타로는 가벼운 재미와 자기성찰을 위한 리딩이에요.</p>
    </section>
  </main>;

  if (phase === "review" && session) return <main className={styles.page}>
    <section className={`${styles.surface} ${styles.review}`} aria-labelledby="destiny-review-title">
      <button className={styles.textButton} type="button" onClick={() => setPhase("chat")}>← 대화로 돌아가기</button>
      <div className={styles.reviewHeading}><Avatar /><div><p className={styles.eyebrow}>READY · YOUR QUESTION</p><h1 id="destiny-review-title">이렇게 고민을<br />정리해봤어요.</h1></div></div>
      <section className={styles.summaryCard} aria-label="고민 요약"><p>고민 요약</p><strong>{session.summary ?? ""}</strong></section>
      <label className={styles.questionEditor}><span>이번에 살펴볼 질문</span><textarea value={reviewQuestion} onChange={(event) => setSession((current) => current ? { ...current, finalQuestion: event.target.value } : current)} maxLength={300} aria-describedby="destiny-question-help" /></label>
      <p className={styles.editorHelp} id="destiny-question-help">그대로 사용하거나, 지금 마음에 더 맞는 표현으로 수정할 수 있어요.</p>
      <button className={styles.primaryButton} type="button" disabled={reviewQuestion.trim().length < 8} onClick={() => setPhase("confirmed")}>이 질문으로 리딩 준비하기 <span>→</span></button>
    </section>
  </main>;

  if (phase === "confirmed" && session) return <main className={styles.page}>
    <section className={`${styles.surface} ${styles.confirmed}`} aria-labelledby="destiny-confirmed-title">
      <Avatar />
      <p className={styles.eyebrow}>QUESTION CONFIRMED</p>
      <h1 id="destiny-confirmed-title">질문을<br />마음에 담아두었어요.</h1>
      <p className={styles.confirmedQuestion}>“{session.finalQuestion}”</p>
      <p className={styles.confirmedCopy}>다음 단계에서 카드 방향과 장수를 직접 고르고, 이 질문에 맞는 스프레드를 준비하게 됩니다.</p>
      <button className={styles.secondaryButton} type="button" onClick={() => setPhase("review")}>질문 다시 수정하기</button>
      <Link className={styles.homeButton} href="/">운명타로 홈으로</Link>
    </section>
  </main>;

  return <main className={styles.page}>
    <section className={`${styles.surface} ${styles.chat}`} aria-labelledby="destiny-chat-title">
      <header className={styles.chatHeader}><button className={styles.textButton} type="button" onClick={() => setPhase("intro")}>← 처음으로</button><div><Avatar /><span id="destiny-chat-title">달빛 안내자</span></div></header>
      <p className={styles.chatGuide}>당신의 이야기를 듣고, 필요한 질문 하나만 더 건넬게요. {currentFollowUp ? `추가 질문 ${currentFollowUp}회` : ""}</p>
      <div className={styles.messages} aria-live="polite">
        {conversation.map((message) => <div className={`${styles.messageRow} ${message.role === "user" ? styles.userRow : styles.assistantRow}`} key={message.id}>
          {message.role === "assistant" && <Avatar />}
          <div>
            {message.role === "assistant" && <span className={styles.sender}>달빛 안내자</span>}
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
