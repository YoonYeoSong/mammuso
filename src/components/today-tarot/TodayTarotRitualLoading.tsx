import { TodayTarotHeader } from "./TodayTarotHeader";

type TodayTarotRitualLoadingProps = {
  backHref: string;
  headingId: string;
  headingLines: readonly [string, string];
  descriptionLines: readonly [string, string];
  status: string;
  ariaLabel: string;
};

function MoonPhaseLoader({ ariaLabel }: { ariaLabel: string }) {
  return <div className="today-tarot-ritual-moon-phases" aria-label={ariaLabel}>
    <span className="today-tarot-ritual-phase today-tarot-ritual-phase--crescent-left" />
    <span className="today-tarot-ritual-phase today-tarot-ritual-phase--quarter-left" />
    <span className="today-tarot-ritual-phase today-tarot-ritual-phase--full" />
    <span className="today-tarot-ritual-phase today-tarot-ritual-phase--quarter-right" />
    <span className="today-tarot-ritual-phase today-tarot-ritual-phase--crescent-right" />
  </div>;
}

/** Shared visual shell for the two loading moments in today's tarot ritual. */
export function TodayTarotRitualLoading({
  backHref,
  headingId,
  headingLines,
  descriptionLines,
  status,
  ariaLabel,
}: TodayTarotRitualLoadingProps) {
  return <main className="today-tarot-page today-tarot-ritual-page">
    <div className="today-tarot-app-surface">
      <TodayTarotHeader backHref={backHref} />
      <section className="today-tarot-ritual-loading" aria-live="polite" aria-labelledby={headingId}>
        <div className="today-tarot-ritual-loading-visual" aria-hidden="true" />
        <div className="today-tarot-ritual-loading-copy">
          <h2 id={headingId}>{headingLines[0]}<br />{headingLines[1]}</h2>
          <p>{descriptionLines[0]}<br />{descriptionLines[1]}</p>
          <MoonPhaseLoader ariaLabel={ariaLabel} />
          <small className="today-tarot-ritual-loading-status">{status}</small>
        </div>
      </section>
    </div>
  </main>;
}
