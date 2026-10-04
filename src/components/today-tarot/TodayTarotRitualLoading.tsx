"use client";

import { useEffect, useState } from "react";
import { TodayTarotHeader } from "./TodayTarotHeader";

type TodayTarotLoadingSceneProps = {
  backHref: string;
  ariaLabel: string;
  phase: "preparing" | "interpreting";
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
    "당신의 오늘을 살펴보고 있어요",
    "오늘의 흐름을 준비하고 있어요",
    "이제, 당신의 카드를 만나볼까요?",
  ],
  interpreting: [
    "선택한 카드를 확인하고 있어요",
    "카드가 전하는 의미를 읽고 있어요",
    "오늘의 흐름과 카드를\n함께 살펴보고 있어요",
    "두 흐름이 만나는 지점을 찾고 있어요",
    "당신을 위한 오늘의 이야기를\n정리하고 있어요",
    "곧 결과를 보여드릴게요",
  ],
} as const;

function LoadingMessage({ message }: { message: string }) {
  const lines = message.split("\n");
  return <>{lines.map((line, index) => <span key={`${line}-${index}`}>{line}{index < lines.length - 1 && <br />}</span>)}</>;
}

/** The single loading visual used before selection and while the reading is prepared. */
export function TodayTarotLoadingScene({
  backHref,
  ariaLabel,
  phase,
  isExiting = false,
  onSequenceComplete,
}: TodayTarotLoadingSceneProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const messages = loadingMessages[phase];

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
