import Link from "next/link";
import { DailyHeartLetter } from "@/components/DailyHeartLetter";
import { Disclaimer, Hamji, SiteFooter, SiteHeader } from "@/components/SiteChrome";

export default function Home() {
  return <main>
    <SiteHeader />
    <section className="hero">
      <div>
        <p className="eyebrow">가상 마음 행정기관 · 관계 민원 창구</p>
        <h1>마음에 일이<br /><em>생기셨나요?</em></h1>
        <p className="lead">혼자 처리하기 어려운 마음을, 너무 심각해지기 전에 차분히 접수해드립니다.</p>
        <Link href="/intake" className="button">민원 접수하기 <span>→</span></Link>
      </div>
      <div className="hero-character"><div className="hero-ham"><img src="/illustrations/hamji-clerk.png" alt="서류를 든 김햄찌 주무관" /></div></div>
    </section>
    <DailyHeartLetter />
    <section id="process" className="process-strip" aria-label="민원 처리 순서">
      <p className="eyebrow">민원 처리 절차</p>
      <ol>
        <li><b>01</b><span>사연 접수</span></li>
        <li><b>02</b><span>사실 확인</span></li>
        <li><b>03</b><span>상대방 출석</span></li>
        <li><b>04</b><span>조정 결과</span></li>
      </ol>
    </section>
    <section className="department">
      <div className="section-title"><div><p className="eyebrow">현재 운영 부서</p><h2>어느 부서로 안내해드릴까요?</h2></div><span className="department-note">현재 1개 부서 운영 중</span></div>
      <Link href="/intake" className="dept active"><span>⚖️</span><div><b>관계분쟁조정과</b><p>누가 잘못했는지 모르겠다면 일단 접수해주세요.</p></div><strong>접수 가능 →</strong></Link>
      <div className="dept"><span>🫧</span><div><b>마음세탁과</b><p>개설 준비 중</p></div><strong>COMING SOON</strong></div>
      <div className="dept"><span>🗑️</span><div><b>걱정폐기물과</b><p>개설 준비 중</p></div><strong>COMING SOON</strong></div>
      <div className="dept"><span>🔧</span><div><b>후회복구과</b><p>개설 준비 중</p></div><strong>COMING SOON</strong></div>
    </section>
    <Hamji text="말랑한 마음일수록, 서류는 차분하게 살펴보겠습니다." />
    <Disclaimer />
    <SiteFooter />
  </main>;
}
