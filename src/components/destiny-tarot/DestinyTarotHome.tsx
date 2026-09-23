import Image from "next/image";
import { CrystalSymbol } from "./CrystalSymbol";
import { ServiceMenu } from "./ServiceMenu";

type ReadingPreview = {
  title: string;
  date: string;
  thumbnail: string;
};

const mockReading: ReadingPreview = {
  title: "그 사람과의 궁합",
  date: "2026.09.23",
  thumbnail: "/tarot/arcana/17-star.png",
};

function CrystalCount({ count }: { count: number }) {
  return <button type="button" className="destiny-crystal-count" aria-label={`보유 수정구 ${count}개`}>
    <CrystalSymbol name="crystal" />
    <span>{count}</span>
  </button>;
}

function Header() {
  return <header className="destiny-header">
    <a className="destiny-brand" href="#destiny-home" aria-label="운명타로 홈">
      <span>운명타로</span>
      <small>DESTINY TAROT</small>
    </a>
    <div className="destiny-header-actions">
      <CrystalCount count={5} />
      <button type="button" className="destiny-menu-button" aria-label="메뉴 열기"><i /><i /><i /></button>
    </div>
  </header>;
}

function Hero() {
  return <section className="destiny-hero" aria-labelledby="destiny-hero-title">
    <div className="destiny-hero-sky" aria-hidden="true">
      <span className="destiny-moon" />
      <span className="destiny-star-field" />
      <span className="destiny-sky-arc" />
      <span className="destiny-city city-near" />
      <span className="destiny-city city-far" />
      <span className="destiny-water" />
      <span className="destiny-reflection" />
      <span className="destiny-lantern lantern-left" />
      <span className="destiny-lantern lantern-right" />
      <span className="destiny-stargazer"><i /><b /></span>
      <span className="destiny-cat"><i /><b /></span>
      <span className="destiny-wisteria" />
    </div>
    <div className="destiny-hero-copy">
      <p className="destiny-eyebrow">A QUIET SIGN IN THE NIGHT</p>
      <h1 id="destiny-hero-title">오늘,<br />어떤 이야기가<br />당신을 기다리고<br />있을까요?</h1>
      <p className="destiny-hero-subcopy">지금 이 순간도,<br />당신의 이야기는 계속되고 있어요.</p>
    </div>
  </section>;
}

function MoodBanner() {
  return <section className="destiny-mood-banner" aria-label="운명타로 안내">
    <span className="destiny-banner-moon" aria-hidden="true" />
    <span className="destiny-banner-ridge" aria-hidden="true" />
    <p>작은 한 장이,<br /><strong>더 큰 이야기를 만듭니다.</strong></p>
    <span aria-hidden="true" className="destiny-banner-arrow">›</span>
  </section>;
}

function RecentReading({ reading = mockReading }: { reading?: ReadingPreview | null }) {
  return <section className="destiny-recent-reading" aria-labelledby="recent-reading-title">
    <div className="destiny-section-heading">
      <h2 id="recent-reading-title">최근 리딩 기록</h2>
      <button type="button" className="destiny-view-all">전체보기 <span aria-hidden="true">›</span></button>
    </div>
    {reading ? <article className="destiny-reading-card">
      <div className="destiny-reading-thumbnail"><Image src={reading.thumbnail} alt="" fill sizes="64px" /></div>
      <div><h3>{reading.title}</h3><time dateTime={reading.date.replaceAll(".", "-")}>{reading.date}</time></div>
      <span className="destiny-reading-arrow" aria-hidden="true">›</span>
    </article> : <div className="destiny-reading-empty"><CrystalSymbol name="star" /><p>아직 남겨진 리딩이 없어요.</p></div>}
  </section>;
}

function BottomNavigation() {
  return <nav className="destiny-bottom-navigation" aria-label="주요 메뉴">
    <button type="button" className="destiny-nav-item is-active" aria-current="page"><CrystalSymbol name="home" /><span>홈</span></button>
    <button type="button" className="destiny-nav-item" data-destination="/readings"><CrystalSymbol name="history" /><span>리딩 기록</span></button>
    <button type="button" className="destiny-nav-item" data-destination="/profile"><CrystalSymbol name="profile" /><span>내 정보</span></button>
  </nav>;
}

export function DestinyTarotHome() {
  return <main id="destiny-home" className="destiny-home">
    <div className="destiny-app-surface">
      <Header />
      <Hero />
      <ServiceMenu />
      <MoodBanner />
      <RecentReading />
    </div>
    <BottomNavigation />
  </main>;
}
