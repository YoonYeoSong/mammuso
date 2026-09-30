import { TodayTarotHeader } from "./TodayTarotHeader";

type TodayTarotLoadingSceneProps = {
  backHref: string;
  ariaLabel: string;
};

const loadingMessages = [
  "오늘의 흐름을 살펴보고 있어요…",
  "선택한 카드의 이야기를 읽고 있어요…",
  "두 흐름을 하나로 연결하고 있어요…",
] as const;

/** The single loading visual used before selection and while the reading is prepared. */
export function TodayTarotLoadingScene({
  backHref,
  ariaLabel,
}: TodayTarotLoadingSceneProps) {
  return <main className="today-tarot-page today-tarot-ritual-page">
    <div className="today-tarot-app-surface">
      <TodayTarotHeader backHref={backHref} />
      <section className="today-tarot-loading-scene" aria-busy="true" aria-label={ariaLabel}>
        <div className="today-tarot-loading-visual" aria-hidden="true">
          <div className="today-tarot-crystal-effects">
            <span className="today-tarot-crystal-mist today-tarot-crystal-mist--one" />
            <span className="today-tarot-crystal-mist today-tarot-crystal-mist--two" />
            <span className="today-tarot-crystal-glow" />
            <span className="today-tarot-crystal-shimmer" />
            <span className="today-tarot-crystal-star today-tarot-crystal-star--one" />
            <span className="today-tarot-crystal-star today-tarot-crystal-star--two" />
            <span className="today-tarot-crystal-star today-tarot-crystal-star--three" />
            <span className="today-tarot-crystal-star today-tarot-crystal-star--four" />
            <span className="today-tarot-crystal-star today-tarot-crystal-star--five" />
          </div>
        </div>
        <div className="today-tarot-loading-copy" aria-live="polite">
          <div className="today-tarot-loading-message-frame">
            {loadingMessages.map((message) => <p key={message}>{message}</p>)}
          </div>
        </div>
      </section>
    </div>
  </main>;
}
