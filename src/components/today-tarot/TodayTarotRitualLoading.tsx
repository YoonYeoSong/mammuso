import { TodayTarotHeader } from "./TodayTarotHeader";

type TodayTarotLoadingSceneProps = {
  backHref: string;
  ariaLabel: string;
};

const loadingMessages = [
  "사주 속 오늘의 흐름을 읽고 있어요",
  "선택한 카드의 의미를 살펴보고 있어요",
  "두 흐름이 만나는 지점을 찾고 있어요",
  "당신을 위한 오늘의 이야기를 완성하고 있어요",
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
            {loadingMessages.map((message) => <p key={message}>{message}</p>)}
          </div>
        </div>
      </section>
    </div>
  </main>;
}
