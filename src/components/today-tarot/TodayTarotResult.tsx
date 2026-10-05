"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { TodayTarotHeader } from "./TodayTarotHeader";
import { DestinyTarotFooter } from "@/components/destiny-tarot/DestinyTarotFooter";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { todayTarotRoutes, type TodayTarotSession } from "@/lib/today-tarot/flow";
import { getTodayTarotCard } from "@/lib/today-tarot/deck";

type Orientation = "upright" | "reversed";
type OpenSections = Record<string, boolean>;

function orientationLabel(orientation: Orientation) { return orientation === "reversed" ? "역방향" : "정방향"; }
function FlowIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.25" /><path d="M12 3v2M12 19v2M5 12h2M17 12h2M7.05 7.05l1.42 1.42M15.53 15.53l1.42 1.42M16.95 7.05l-1.42 1.42M8.47 15.53l-1.42 1.42" /></svg>; }
function CardIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="6.5" y="3.5" width="11" height="17" rx="1.5" /><path d="M12 8.75 12.7 11.3 15.25 12 12.7 12.7 12 15.25 11.3 12.7 8.75 12 11.3 11.3 12 8.75Z" /></svg>; }
function SproutIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19v-6.25M12 14.25c-2.85-.1-4.72-1.5-5.5-4.25 2.83-.1 4.88 1.27 5.5 4.25ZM12 14.25c.65-2.98 2.7-4.35 5.5-4.25-.77 2.75-2.65 4.15-5.5 4.25Z" /></svg>; }
function FortuneIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><ellipse cx="12" cy="7.35" rx="2.35" ry="3.35" /><ellipse cx="12" cy="16.65" rx="2.35" ry="3.35" /><ellipse cx="7.35" cy="12" rx="3.35" ry="2.35" /><ellipse cx="16.65" cy="12" rx="3.35" ry="2.35" /><circle cx="12" cy="12" r=".8" fill="currentColor" stroke="none" /></svg>; }
function ChevronIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6.75 9.5 5.25 5.25 5.25-5.25" /></svg>; }

function Accordion({ id, title, icon, children, open, onToggle }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode; open: boolean; onToggle: () => void }) {
  const panelId = `today-tarot-${id}-panel`;
  return <section className={`today-tarot-result-accordion ${open ? "is-open" : ""}`}><button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panelId}><span className="today-tarot-accordion-heading"><span className="today-tarot-accordion-icon">{icon}</span><span className="today-tarot-accordion-title">{title}</span></span><span className="today-tarot-accordion-chevron"><ChevronIcon /></span></button><div className="today-tarot-accordion-panel" id={panelId}><div><div className="today-tarot-accordion-panel-inner">{children}</div></div></div></section>;
}

function ReadingCard({ label, cardId, orientation }: { label: string; cardId: string; orientation: Orientation }) {
  const card = getTodayTarotCard(cardId);
  return <article className="today-tarot-main-card"><p>{label}</p>{card?.imageReady ? <span className={`today-tarot-main-card-art ${orientation === "reversed" ? "is-reversed" : ""}`}><Image src={card.image} alt={`${card.nameKo} 카드`} fill sizes="(max-width: 480px) 38vw, 168px" /></span> : <span className="today-tarot-main-card-placeholder" aria-hidden="true">✦</span>}<h3>{card?.nameKo ?? "오늘의 카드"}</h3><small>{orientationLabel(orientation)}</small></article>;
}

export function TodayTarotResult() {
  const [session, setSession] = useState<TodayTarotSession | null>(null);
  const [open, setOpen] = useState<OpenSections>({});
  useEffect(() => { try { const raw = window.sessionStorage.getItem(TODAY_TAROT_SESSION_KEY); const saved = raw ? JSON.parse(raw) as TodayTarotSession : null; if (saved?.mainCardId && saved.mainOrientation) setSession(saved); } catch { /* Show recovery UI. */ } }, []);

  if (!session || !session.mainCardId || !session.mainOrientation) return <main className="today-tarot-page today-tarot-result-page"><div className="today-tarot-app-surface"><TodayTarotHeader /><section className="today-tarot-result-empty"><h2>리딩을 찾을 수 없어요.</h2><Link href={todayTarotRoutes.intro}>오늘의 타로 시작하기</Link></section></div></main>;

  const mainCard = getTodayTarotCard(session.mainCardId), clarifierCard = session.clarifierCardId ? getTodayTarotCard(session.clarifierCardId) : undefined;
  const hasClarifier = Boolean(clarifierCard && session.clarifierOrientation);
  const mainName = mainCard?.nameKo ?? "메인카드", clarifierName = clarifierCard?.nameKo ?? "보조카드";
  const toggle = (section: string) => setOpen((current) => ({ ...current, [section]: !current[section] }));
  const headline = hasClarifier ? `${mainName}의 메시지에 ${clarifierName}의 힌트가 더해졌어요.` : `${mainName}의 메시지를 차분히 따라가 보세요.`;
  const lead = hasClarifier ? "두 카드는 같은 답을 반복하기보다, 오늘 무엇을 우선해 바라볼지 함께 알려줘요." : "답을 서두르기보다, 지금 마음에 남는 한 가지를 다정하게 살펴보는 오늘이에요.";

  return <main className="today-tarot-page today-tarot-result-page"><div className="today-tarot-app-surface"><TodayTarotHeader backHref={todayTarotRoutes.intro} title="오늘의 리딩" />
    <section className="today-tarot-result" aria-labelledby="today-result-title"><p className="today-tarot-result-kicker">오늘의 한마디</p><h2 id="today-result-title">{headline}</h2><p className="today-tarot-result-lead">{lead}</p>
      <div className={`today-tarot-reading-cards ${hasClarifier ? "has-clarifier" : ""}`}><ReadingCard label="메인카드" cardId={session.mainCardId} orientation={session.mainOrientation} />{hasClarifier && session.clarifierCardId && session.clarifierOrientation && <ReadingCard label="보조카드" cardId={session.clarifierCardId} orientation={session.clarifierOrientation} />}</div>
      <div className="today-tarot-result-accordions"><Accordion id="flow" title="오늘의 흐름" icon={<FlowIcon />} open={Boolean(open.flow)} onToggle={() => toggle("flow")}>{hasClarifier ? <><b>메인카드 {mainName}의 메시지</b>는 오늘의 중심을 먼저 보여주고, <b>보조카드 {clarifierName}의 힌트</b>는 그 흐름을 어떻게 다룰지 보완해요. 두 장을 한 번에 떠올리며 가장 편안한 선택을 골라보세요.</> : <><b>메인카드 {mainName}의 메시지</b>는 오늘의 중심에 있어요. 지금 가장 중요하게 느껴지는 한 가지를 확인하고, 그 감각에 맞춰 흐름을 정리해보세요.</>}</Accordion><Accordion id="detail" title="상세 해석" icon={<CardIcon />} open={Boolean(open.detail)} onToggle={() => toggle("detail")}>{hasClarifier ? <><p><b>메인카드 · {mainName}</b><br />오늘의 핵심을 보여줘요. 지금 가진 감각을 믿되, 작은 확인을 거쳐 움직여 보라고 이야기합니다.</p><p><b>보조카드 · {clarifierName}</b><br />메인카드의 뜻을 더 구체화해요. 놓치기 쉬운 조건이나 새로운 관점을 보태며, 서두르지 않고 방향을 다듬게 합니다.</p><p><b>두 카드의 관계</b><br />첫 번째 메시지를 출발점으로 삼고, 두 번째 힌트로 속도와 우선순위를 조율해보세요.</p></> : <><b>메인카드 {mainName}의 메시지</b>는 지금 가진 감각을 믿되, 작은 확인을 거쳐 움직여 보라고 이야기해요. 꼭 필요한 일부터 차분히 고르면 충분합니다.</>}</Accordion><Accordion id="advice" title="오늘의 조언" icon={<SproutIcon />} open={Boolean(open.advice)} onToggle={() => toggle("advice")}>{hasClarifier ? "두 카드가 함께 가리키는 한 가지를 정해보세요. 오늘은 답을 늘리기보다, 가장 설득력 있는 작은 행동 하나를 끝까지 해보는 것이 좋아요." : "미뤄둔 한 가지를 아주 작게 시작해 보세요. 오늘은 완벽한 답보다 부담 없는 첫걸음이 잘 어울립니다."}</Accordion><Accordion id="keywords" title="행운의 키워드" icon={<FortuneIcon />} open={Boolean(open.keywords)} onToggle={() => toggle("keywords")}>{hasClarifier ? "우선순위 · 선명한 확인 · 조율된 용기" : "여유 · 선명함 · 작은 용기"}</Accordion></div>
      {!hasClarifier && <section className="today-tarot-clarifier-cta"><p>한 장 더 깊이 보고 싶다면</p><h3>보조카드로 오늘의 메시지를 더 선명하게 만나보세요.</h3><Link href={`${todayTarotRoutes.selection}?mode=clarifier`}>테스트 보조카드 선택</Link></section>}
    </section><DestinyTarotFooter /></div></main>;
}
