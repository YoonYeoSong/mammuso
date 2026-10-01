"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { TodayTarotHeader } from "./TodayTarotHeader";
import { DestinyTarotFooter } from "@/components/destiny-tarot/DestinyTarotFooter";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { TODAY_TAROT_PROFILE_KEY } from "@/lib/today-tarot/profile";
import { todayTarotRoutes, type TodayTarotSession } from "@/lib/today-tarot/flow";
import { getTodayTarotCard } from "@/lib/today-tarot/deck";

type OpenSections = Record<string, boolean>;
const cardTitle = (id?: string) => id ? getTodayTarotCard(id)?.nameKo ?? "오늘의 카드" : "오늘의 카드";

function Accordion({ title, children, open, onToggle }: { title: string; children: React.ReactNode; open: boolean; onToggle: () => void }) {
  return <section className={`today-tarot-result-accordion ${open ? "is-open" : ""}`}><button type="button" onClick={onToggle} aria-expanded={open}><span>{title}</span><span aria-hidden="true">⌄</span></button><div className="today-tarot-accordion-panel"><div>{children}</div></div></section>;
}

export function TodayTarotResult() {
  const [session, setSession] = useState<TodayTarotSession | null>(null);
  const [member, setMember] = useState(false);
  const [open, setOpen] = useState<OpenSections>({});

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(TODAY_TAROT_SESSION_KEY);
      const saved = raw ? JSON.parse(raw) as TodayTarotSession : null;
      if (saved?.selectedCardId) setSession(saved);
      // A guest's birth data never enters the deck/session or a server call.
      // Once the result has been reached, remove the temporary input as promised.
      if (saved?.profileSource === "guest") window.sessionStorage.removeItem(TODAY_TAROT_PROFILE_KEY);
    } catch { /* Show recovery UI. */ }
    void fetch("/api/auth/me").then((response) => response.ok ? response.json() : { user: null }).then((data: { user: unknown }) => setMember(Boolean(data.user)));
  }, []);

  if (!session) return <main className="today-tarot-page today-tarot-result-page"><div className="today-tarot-app-surface"><TodayTarotHeader /><section className="today-tarot-result-empty"><h2>리딩을 찾을 수 없어요.</h2><Link href={todayTarotRoutes.intro}>오늘의 타로 시작하기</Link></section></div></main>;
  const mainName = cardTitle(session.selectedCardId);
  const clarifierName = cardTitle(session.clarifierCardId);
  const mainCard = session.selectedCardId ? getTodayTarotCard(session.selectedCardId) : undefined;
  const toggle = (section: string) => setOpen((current) => ({ ...current, [section]: !current[section] }));
  return <main className="today-tarot-page today-tarot-result-page"><div className="today-tarot-app-surface"><TodayTarotHeader backHref={todayTarotRoutes.intro} title="오늘의 리딩" />
    <section className="today-tarot-result" aria-labelledby="today-result-title"><p className="today-tarot-result-kicker">오늘의 한마디</p><h2 id="today-result-title">{session.orientation === "reversed" ? "잠시 시선을 돌려보세요." : "가벼운 확신을 따라가 보세요."}</h2><p className="today-tarot-result-lead">답을 서두르기보다, 지금 마음에 남는 한 가지를 다정하게 살펴보는 오늘이에요.</p>
      <article className="today-tarot-main-card">{mainCard?.imageReady ? <span className={`today-tarot-main-card-art ${session.orientation === "reversed" ? "is-reversed" : ""}`}><Image src={mainCard.image} alt={`${mainCard.nameKo} 카드`} fill sizes="66px" /></span> : <span aria-hidden="true">✦</span>}<div><p>메인카드</p><h3>{mainName}</h3><small>{session.orientation === "reversed" ? "역방향" : "정방향"}</small></div></article>
      <div className="today-tarot-result-accordions"><Accordion title="오늘의 사주 흐름" open={Boolean(open.flow)} onToggle={() => toggle("flow")}>태어난 시간 정보와 오늘의 리딩을 함께 보되, 이 결과는 현재를 정리하기 위한 가벼운 참고로만 사용해주세요.</Accordion><Accordion title="상세 해석" open={Boolean(open.detail)} onToggle={() => toggle("detail")}>{mainName}은(는) 지금 가진 감각을 믿되, 작은 확인을 거쳐 움직여 보라고 이야기해요. 꼭 필요한 일부터 차분히 고르면 충분합니다.</Accordion><Accordion title="오늘의 조언" open={Boolean(open.advice)} onToggle={() => toggle("advice")}>미뤄둔 한 가지를 아주 작게 시작해 보세요. 오늘은 완벽한 답보다 부담 없는 첫걸음이 잘 어울립니다.</Accordion><Accordion title="행운의 키워드" open={Boolean(open.keywords)} onToggle={() => toggle("keywords")}>여유 · 선명함 · 작은 용기</Accordion>{session.clarifierCardId && <Accordion title="보조카드 해석" open={Boolean(open.clarifier)} onToggle={() => toggle("clarifier")}><b>{clarifierName}</b>은(는) 메인카드의 뜻을 구체화해요. 오늘은 하나의 기준을 정한 뒤, 그 기준에서 벗어나는 선택은 잠시 미뤄보세요.</Accordion>}</div>
      {member ? (session.clarifierCardId ? <p className="today-tarot-result-saved">보조카드까지 리딩 기록에 저장했어요.</p> : <section className="today-tarot-clarifier-cta"><p>오늘의 흐름을 조금 더 확인해볼까요?</p><h3>보조카드 한 장으로 오늘의 조언을 더 깊게 만나보세요.</h3><Link href={`${todayTarotRoutes.selection}?mode=clarifier`}>보조카드 한 장 더 뽑기 <small>무료</small></Link></section>) : <section className="today-tarot-clarifier-cta"><p>한 장 더 깊이 보고 싶다면</p><h3>로그인하면 오늘의 보조카드 1장을 무료로 뽑을 수 있어요.</h3><Link href="/login?returnTo=/today-tarot/result">로그인하고 보조카드 보기</Link></section>}
      {member && <Link className="today-tarot-profile-edit" href="/today-tarot/profile?mode=member">사주정보 수정하기</Link>}
    </section><DestinyTarotFooter /></div></main>;
}
