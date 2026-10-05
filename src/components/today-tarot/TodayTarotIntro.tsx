import { TodayTarotHeader } from "./TodayTarotHeader";
import { TodayTarotStart } from "./TodayTarotStart";

type IntroBenefit = {
  title: string;
  description: string;
  icon: "sun" | "moon" | "path" | "orientation";
};

const benefits: IntroBenefit[] = [
  { icon: "sun", title: "하루 1회 무료 리딩", description: "매일 새로운 이야기를 만나요." },
  { icon: "moon", title: "카드 한 장으로 보는 해석", description: "오늘의 흐름을 가볍게 읽어요." },
  { icon: "path", title: "짧지만 명확한 조언", description: "오늘을 위한 방향을 제시해요." },
  { icon: "orientation", title: "오늘의 타로는 방향도 랜덤", description: "카드의 정·역방향도 랜덤으로 결정돼요." },
];

function BenefitIcon({ icon }: { icon: IntroBenefit["icon"] }) {
  const shared = { fill: "none", stroke: "currentColor", strokeWidth: 1.45, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (icon === "sun") return <svg viewBox="0 0 48 48" aria-hidden="true" {...shared}><circle cx="24" cy="24" r="7.5" /><path d="M24 5.5v5M24 37.5v5M5.5 24h5M37.5 24h5M10.9 10.9l3.5 3.5M33.6 33.6l3.5 3.5M37.1 10.9l-3.5 3.5M14.4 33.6l-3.5 3.5" /></svg>;
  if (icon === "moon") return <svg viewBox="0 0 48 48" aria-hidden="true" {...shared}><path d="M34.8 32.8A15.2 15.2 0 0 1 15.2 13.2 15.2 15.2 0 1 0 34.8 32.8Z" /><path d="m34.5 9.5 1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1Z" /></svg>;
  if (icon === "orientation") return <svg viewBox="0 0 48 48" aria-hidden="true" {...shared}><rect x="17" y="12" width="14" height="24" rx="2" /><path d="M13 18.4a13 13 0 0 1 20-4.1M33 12.5v4.1h-4.1M35 29.6a13 13 0 0 1-20 4.1M15 35.5v-4.1h4.1" /><path d="M24 18.5v11M20.5 22l3.5-3.5 3.5 3.5M27.5 26l-3.5 3.5-3.5-3.5" /></svg>;
  return <svg viewBox="0 0 48 48" aria-hidden="true" {...shared}><path d="M8 37.5c8.4-1.1 10.5-10.6 18-14.5 4.9-2.5 8.3-1.3 14-8.5" /><path d="m35 13.2 5 .3-.4 5" /><path d="M10 12.5h8M10 18.5h5" /><circle cx="9" cy="37.5" r="2.5" /></svg>;
}

export function TodayTarotIntro({ startOpen = false }: { startOpen?: boolean }) {
  return <main className="today-tarot-page today-tarot-intro-page">
    <div className="today-tarot-app-surface">
      <TodayTarotHeader />
      <section className="today-tarot-intro" aria-labelledby="today-tarot-intro-title">
        <div className="today-tarot-intro-copy">
          <h2 id="today-tarot-intro-title">지금, 당신의 오늘을<br />카드 한 장에 담아볼까요?</h2>
          <p>오늘의 흐름을 비추는 카드가<br />당신에게 전하는 메시지를 확인해보세요.</p>
        </div>
      </section>

      <p className="today-tarot-formula"><span>오늘의 흐름</span><b>×</b><span>내가 선택한 타로</span></p>

      <section className="today-tarot-benefits" aria-label="오늘의 타로 안내">
        {benefits.map((benefit) => <article key={benefit.title} className="today-tarot-benefit">
          <span className="today-tarot-benefit-icon"><BenefitIcon icon={benefit.icon} /></span>
          <div><h3>{benefit.title}</h3><p>{benefit.description}</p></div>
        </article>)}
      </section>

      <div className="today-tarot-cta-wrap">
        <TodayTarotStart openInitially={startOpen} />
      </div>
    </div>
  </main>;
}
