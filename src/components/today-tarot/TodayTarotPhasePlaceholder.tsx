import Link from "next/link";
import { todayTarotRoutes } from "@/lib/today-tarot/flow";
import { TodayTarotHeader } from "./TodayTarotHeader";

/** Route hand-off only — the preparation screen's visual design is intentionally deferred. */
export function TodayTarotPhasePlaceholder() {
  return <main className="today-tarot-page today-tarot-placeholder-page">
    <div className="today-tarot-app-surface">
      <TodayTarotHeader backHref={todayTarotRoutes.intro} />
      <section className="today-tarot-placeholder" aria-labelledby="today-tarot-preparing-title">
        <p>STEP 02</p>
        <h2 id="today-tarot-preparing-title">오늘의 흐름 준비</h2>
        <span aria-hidden="true" />
      </section>
      <Link className="today-tarot-placeholder-back" href={todayTarotRoutes.intro}>소개로 돌아가기</Link>
    </div>
  </main>;
}
