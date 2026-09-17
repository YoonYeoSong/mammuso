import Link from "next/link";
import { Disclaimer, SiteFooter, SiteHeader } from "@/components/SiteChrome";

export default function Home() {
  return <main>
    <SiteHeader />
    <section className="hero home-menu-hero">
      <div>
        <p className="eyebrow">맘무소 · 관계 민원 창구</p>
        <h1>마음에 일이<br /><em>생기셨나요?</em></h1>
        <p className="lead">아래 메뉴에서 필요한 곳으로 들어가세요.</p>
      </div>
      <div className="hero-character"><div className="hero-ham"><img src="/illustrations/hamji-clerk.png" alt="서류를 든 김햄찌 주무관" /></div></div>
    </section>
    <nav className="home-menu" aria-label="메인 메뉴">
      <Link href="/intake" className="home-menu-item primary"><span aria-hidden="true">✎</span><div><b>민원 접수</b><p>날짜와 있었던 일을 적습니다.</p></div><i aria-hidden="true">→</i></Link>
      <Link href="/terms" className="home-menu-item"><span aria-hidden="true">?</span><div><b>이용 안내</b><p>어떻게 진행되는지 확인합니다.</p></div><i aria-hidden="true">→</i></Link>
      <Link href="/privacy" className="home-menu-item"><span aria-hidden="true">⌑</span><div><b>개인정보 안내</b><p>기록과 동의 내용을 확인합니다.</p></div><i aria-hidden="true">→</i></Link>
    </nav>
    <Disclaimer />
    <SiteFooter />
  </main>;
}
