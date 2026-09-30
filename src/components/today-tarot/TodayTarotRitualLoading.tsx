"use client";

import { useEffect, useState } from "react";
import { TodayTarotHeader } from "./TodayTarotHeader";

type TodayTarotLoadingSceneProps = {
  backHref: string;
  ariaLabel: string;
  phase: "preparing" | "interpreting";
  isExiting?: boolean;
};

const loadingMessages = {
  preparing: [
    "오늘의 흐름을 살펴보고 있어요.",
    "입력한 정보를 바탕으로\n오늘의 사주 흐름을 정리하고 있어요.",
    "당신의 오늘을 위한\n카드를 준비하고 있어요.",
  ],
  interpreting: [
    "선택한 카드의 의미를 읽고 있어요.",
    "오늘의 사주 흐름과\n카드를 함께 살펴보고 있어요.",
    "당신을 위한 오늘의 이야기를\n정리하고 있어요.",
  ],
} as const;

function LoadingMessage({ message }: { message: string }) {
  return <>{message.split("\n").map((line, index) => <span key={`${line}-${index}`}>{line}{index === 0 && <br />}</span>)}</>;
}

/** The single loading visual used before selection and while the reading is prepared. */
export function TodayTarotLoadingScene({
  backHref,
  ariaLabel,
  phase,
  isExiting = false,
}: TodayTarotLoadingSceneProps) {
  const [messageIndex, setMessageIndex] = useState(-1);
  const messages = loadingMessages[phase];

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setMessageIndex(0), 700),
      window.setTimeout(() => setMessageIndex(1), 2100),
      window.setTimeout(() => setMessageIndex(2), 3500),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [phase]);

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
          <div className="today-tarot-loading-message-frame">
            {messageIndex >= 0 && <p key={messages[messageIndex]} className={messageIndex === messages.length - 1 ? "is-persistent" : ""}><LoadingMessage message={messages[messageIndex]} /></p>}
          </div>
        </div>
      </section>
    </div>
  </main>;
}
