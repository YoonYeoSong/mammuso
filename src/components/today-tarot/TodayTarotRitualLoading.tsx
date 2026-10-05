"use client";

import { useEffect, useState } from "react";
import { TodayTarotHeader } from "./TodayTarotHeader";

type TodayTarotLoadingSceneProps = {
  backHref: string;
  ariaLabel: string;
  phase: "preparing" | "interpreting";
  interpretationMode?: "main" | "combined";
  isExiting?: boolean;
  onSequenceComplete?: () => void;
};

const MESSAGE_FADE_IN_MS = 300;
const MESSAGE_HOLD_MS = 800;
const MESSAGE_FADE_OUT_MS = 360;
const FINAL_MESSAGE_EXTRA_HOLD_MS = 1000;
export const LOADING_MESSAGE_DURATION_MS = MESSAGE_FADE_IN_MS + MESSAGE_HOLD_MS + MESSAGE_FADE_OUT_MS;
const FINAL_MESSAGE_DURATION_MS = MESSAGE_FADE_IN_MS + MESSAGE_HOLD_MS + FINAL_MESSAGE_EXTRA_HOLD_MS;

const loadingMessages = {
  preparing: [
    "오늘의 카드를 준비하고 있어요.",
    "카드를 천천히 섞고 있어요.",
    "오늘 당신을 기다리는 카드를 펼치고 있어요.",
  ],
  interpreting: [
    "선택한 카드를 읽고 있어요.",
    "카드가 전하는 오늘의 흐름을 살펴보고 있어요.",
    "오늘 필요한 메시지를 정리하고 있어요.",
  ],
} as const;

const combinedInterpretationMessages = [
  "두 카드의 흐름을 함께 살펴보고 있어요.",
  "보조 카드가 더해준 의미를 읽고 있어요.",
  "오늘의 메시지를 조금 더 선명하게 정리하고 있어요.",
] as const;

function LoadingMessage({ message }: { message: string }) {
  const lines = message.split("\n");
  return <>{lines.map((line, index) => <span key={`${line}-${index}`}>{line}{index < lines.length - 1 && <br />}</span>)}</>;
}

/** The single loading visual used before selection and while the reading is prepared. */
export function TodayTarotLoadingScene({
  backHref,
  ariaLabel,
  phase,
  interpretationMode = "main",
  isExiting = false,
  onSequenceComplete,
}: TodayTarotLoadingSceneProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const messages = phase === "interpreting" && interpretationMode === "combined"
    ? combinedInterpretationMessages
    : loadingMessages[phase];

  useEffect(() => {
    setMessageIndex(0);
    setIsLeaving(false);
    let currentMessageIndex = 0;
    let timer: number | undefined;

    const advanceSequence = () => {
      const isFinalMessage = currentMessageIndex === messages.length - 1;
      timer = window.setTimeout(() => {
        if (isFinalMessage) {
          onSequenceComplete?.();
          return;
        }
        setIsLeaving(true);
        timer = window.setTimeout(() => {
          currentMessageIndex += 1;
          setMessageIndex(currentMessageIndex);
          setIsLeaving(false);
          advanceSequence();
        }, MESSAGE_FADE_OUT_MS);
      }, isFinalMessage ? FINAL_MESSAGE_DURATION_MS : MESSAGE_FADE_IN_MS + MESSAGE_HOLD_MS);
    };

    advanceSequence();

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [messages, onSequenceComplete, phase]);

  return <main className={`today-tarot-page today-tarot-ritual-page ${isExiting ? "is-exiting" : ""}`}>
    <div className="today-tarot-app-surface">
      <TodayTarotHeader backHref={backHref} />
      <section className="today-tarot-loading-scene" aria-busy={!isExiting} aria-label={ariaLabel}>
        <div className="today-tarot-loading-visual" aria-hidden="true">
          <div className="today-tarot-crystal-effects">
            <span className="today-tarot-crystal-nebula" />
            <span className="today-tarot-crystal-mist today-tarot-crystal-mist--one" />
            <span className="today-tarot-crystal-mist today-tarot-crystal-mist--two" />
            <span className="today-tarot-crystal-glow" />
            <span className="today-tarot-crystal-light" />
            <span className="today-tarot-crystal-shimmer" />
            <span className="today-tarot-crystal-star today-tarot-crystal-star--one" />
            <span className="today-tarot-crystal-star today-tarot-crystal-star--two" />
            <span className="today-tarot-crystal-star today-tarot-crystal-star--three" />
            <span className="today-tarot-crystal-star today-tarot-crystal-star--four" />
            <span className="today-tarot-crystal-star today-tarot-crystal-star--five" />
            <span className="today-tarot-crystal-star today-tarot-crystal-star--six" />
            <span className="today-tarot-crystal-star today-tarot-crystal-star--seven" />
          </div>
        </div>
        <div className="today-tarot-loading-copy" aria-live="polite">
          <div className="today-tarot-loading-content">
            <div className="today-tarot-loading-message-frame" aria-atomic="true">
              <p
                key={messages[messageIndex]}
                className={`is-active ${isLeaving ? "is-leaving" : ""} ${messageIndex === messages.length - 1 ? "is-final" : ""}`}
              >
                <LoadingMessage message={messages[messageIndex]} />
              </p>
            </div>
            <div className="today-tarot-loading-progress" aria-hidden="true">
              {messages.map((message, index) => <span key={message} className={index === messageIndex ? "is-active" : ""} />)}
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>;
}
