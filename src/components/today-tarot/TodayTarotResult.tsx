"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TodayTarotHeader } from "./TodayTarotHeader";
import { DestinyTarotFooter } from "@/components/destiny-tarot/DestinyTarotFooter";
import { TODAY_TAROT_SESSION_KEY } from "@/lib/today-tarot/session";
import { todayTarotRoutes, type TodayTarotSession } from "@/lib/today-tarot/flow";
import { getTodayTarotCard } from "@/lib/today-tarot/deck";
import { createTodayTarotInterpretation } from "@/lib/today-tarot/reading";
import { OrientationBottomSheet, OrientationInfoTrigger } from "./TodayTarotOrientation";

type Orientation = "upright" | "reversed";
type OpenSections = Record<string, boolean>;

function orientationLabel(orientation: Orientation) { return orientation === "reversed" ? "역방향" : "정방향"; }
function conciseConclusion(oneLiner: string, fallback: string) {
  const sentences = oneLiner.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return sentences?.[sentences.length - 1]?.trim() || fallback;
}
function FlowIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.25" /><path d="M12 3v2M12 19v2M5 12h2M17 12h2M7.05 7.05l1.42 1.42M15.53 15.53l1.42 1.42M16.95 7.05l-1.42 1.42M8.47 15.53l-1.42 1.42" /></svg>; }
function CardIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="6.5" y="3.5" width="11" height="17" rx="1.5" /><path d="M12 8.75 12.7 11.3 15.25 12 12.7 12.7 12 15.25 11.3 12.7 8.75 12 11.3 11.3 12 8.75Z" /></svg>; }
function SproutIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19v-6.25M12 14.25c-2.85-.1-4.72-1.5-5.5-4.25 2.83-.1 4.88 1.27 5.5 4.25ZM12 14.25c.65-2.98 2.7-4.35 5.5-4.25-.77 2.75-2.65 4.15-5.5 4.25Z" /></svg>; }
function FortuneIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><ellipse cx="12" cy="7.35" rx="2.35" ry="3.35" /><ellipse cx="12" cy="16.65" rx="2.35" ry="3.35" /><ellipse cx="7.35" cy="12" rx="3.35" ry="2.35" /><ellipse cx="16.65" cy="12" rx="3.35" ry="2.35" /><circle cx="12" cy="12" r=".8" fill="currentColor" stroke="none" /></svg>; }
function ChevronIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6.75 9.5 5.25 5.25 5.25-5.25" /></svg>; }

function Accordion({ id, title, icon, children, open, onToggle }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode; open: boolean; onToggle: () => void }) {
  const panelId = `today-tarot-${id}-panel`;
  return <section className={`today-tarot-result-accordion ${open ? "is-open" : ""}`}><button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panelId}><span className="today-tarot-accordion-heading"><span className="today-tarot-accordion-icon">{icon}</span><span className="today-tarot-accordion-title">{title}</span></span><span className="today-tarot-accordion-chevron"><ChevronIcon /></span></button><div className="today-tarot-accordion-panel" id={panelId}><div><div className="today-tarot-accordion-panel-inner">{children}</div></div></div></section>;
}

function ReadingCard({ label, cardId, orientation, onOrientationInfo }: { label: string; cardId: string; orientation: Orientation; onOrientationInfo: () => void }) {
  const card = getTodayTarotCard(cardId);
  return <article className="today-tarot-main-card"><p>{label}</p>{card?.imageReady ? <span className={`today-tarot-main-card-art ${orientation === "reversed" ? "is-reversed" : ""}`}><Image src={card.image} alt={`${card.nameKo} 카드`} fill sizes="(max-width: 480px) 38vw, 168px" /></span> : <span className="today-tarot-main-card-placeholder" aria-hidden="true">✦</span>}<h3>{card?.nameKo ?? "오늘의 카드"}</h3><span className="today-tarot-card-orientation">{orientationLabel(orientation)}<OrientationInfoTrigger onClick={onOrientationInfo} /></span></article>;
}

export function TodayTarotResult() {
  const router = useRouter();
  const [session, setSession] = useState<TodayTarotSession | null>(null);
  const [open, setOpen] = useState<OpenSections>({});
  const [isOrientationSheetOpen, setIsOrientationSheetOpen] = useState(false);
  useEffect(() => { try { const raw = window.sessionStorage.getItem(TODAY_TAROT_SESSION_KEY); const saved = raw ? JSON.parse(raw) as TodayTarotSession : null; if (saved?.mainCardId && saved.mainOrientation) setSession(saved); } catch { /* Show recovery UI. */ } }, []);

  if (!session || !session.mainCardId || !session.mainOrientation) return <main className="today-tarot-page today-tarot-result-page"><div className="today-tarot-app-surface"><TodayTarotHeader /><section className="today-tarot-result-empty"><h2>리딩을 찾을 수 없어요.</h2><Link href={todayTarotRoutes.intro}>오늘의 타로 시작하기</Link></section></div></main>;

  const mainCard = getTodayTarotCard(session.mainCardId), clarifierCard = session.clarifierCardId ? getTodayTarotCard(session.clarifierCardId) : undefined;
  const hasClarifier = Boolean(clarifierCard && session.clarifierOrientation);
  const mainName = mainCard?.nameKo ?? "메인카드", clarifierName = clarifierCard?.nameKo ?? "보조카드";
  const toggle = (section: string) => setOpen((current) => ({ ...current, [section]: !current[section] }));
  const returnHome = () => {
    window.sessionStorage.removeItem(TODAY_TAROT_SESSION_KEY);
    router.push("/");
  };
  const interpretation = mainCard ? createTodayTarotInterpretation(mainCard, session.mainOrientation, clarifierCard, session.clarifierOrientation ?? undefined) : null;
  const conclusion = conciseConclusion(interpretation?.oneLiner ?? "", "오늘은 마음에 남는 한 가지를 차분히 살펴보기 좋은 날이에요.");

  return <main className="today-tarot-page today-tarot-result-page"><div className="today-tarot-app-surface"><TodayTarotHeader backHref={todayTarotRoutes.intro} title="오늘의 리딩" />
    <section className="today-tarot-result" aria-labelledby="today-result-title"><h2 id="today-result-title">오늘의 타로</h2><p className="today-tarot-result-conclusion">{conclusion}</p>
      <div className={`today-tarot-reading-cards ${hasClarifier ? "has-clarifier" : ""}`}><ReadingCard label="메인카드" cardId={session.mainCardId} orientation={session.mainOrientation} onOrientationInfo={() => setIsOrientationSheetOpen(true)} />{hasClarifier && session.clarifierCardId && session.clarifierOrientation && <ReadingCard label="보조카드" cardId={session.clarifierCardId} orientation={session.clarifierOrientation} onOrientationInfo={() => setIsOrientationSheetOpen(true)} />}</div>
      <div className="today-tarot-result-accordions"><Accordion id="fortune" title="오늘의 운세" icon={<FortuneIcon />} open={Boolean(open.fortune)} onToggle={() => toggle("fortune")}>{interpretation ? <><p><b>총운 · {interpretation.overallLuck}/5</b><br />{interpretation.overallLuckText}</p><p><b>연애운 · {interpretation.loveLuck}/5</b><br />{interpretation.loveLuckText}</p><p><b>금전운 · {interpretation.moneyLuck}/5</b><br />{interpretation.moneyLuckText}</p></> : "오늘의 총운, 연애운, 금전운을 카드로 정리하고 있어요."}</Accordion><Accordion id="flow" title="오늘의 흐름" icon={<FlowIcon />} open={Boolean(open.flow)} onToggle={() => toggle("flow")}>{interpretation?.flow ?? `${mainName}의 메시지를 오늘의 중심에 두고, 지금 가장 중요한 한 가지를 확인해보세요.`}</Accordion><Accordion id="detail" title="상세 해석" icon={<CardIcon />} open={Boolean(open.detail)} onToggle={() => toggle("detail")}>{interpretation ? <><p><b>메인카드 · {mainName}</b><br />{interpretation.mainDetail}</p>{hasClarifier && interpretation.clarifierDetail && <><p><b>보조카드 · {clarifierName}</b><br />{interpretation.clarifierDetail}</p><p><b>두 카드의 관계</b><br />{interpretation.flow}</p></>}</> : <b>메인카드 {mainName}의 메시지를 차분히 살펴보세요.</b>}</Accordion><Accordion id="advice" title="오늘 조심할 것 · 하면 좋은 것" icon={<SproutIcon />} open={Boolean(open.advice)} onToggle={() => toggle("advice")}>{interpretation ? <><p><b>조심할 것</b><br />{interpretation.caution}</p><p><b>하면 좋은 것</b><br />{interpretation.goodToDo}</p><p><b>오늘의 한마디</b><br />{interpretation.oneLiner}</p></> : "오늘 가장 중요한 한 가지를 작게 시작해보세요."}</Accordion><Accordion id="keywords" title="행운의 키워드" icon={<FortuneIcon />} open={Boolean(open.keywords)} onToggle={() => toggle("keywords")}>{interpretation?.keywords.join(" · ") ?? "여유 · 선명함 · 작은 용기"}</Accordion></div>
      {!hasClarifier && <section className="today-tarot-clarifier-cta"><p>한 장 더 깊이 보고 싶다면</p><h3>보조카드로 오늘의 메시지를 더 선명하게 만나보세요.</h3><Link href={`${todayTarotRoutes.selection}?mode=clarifier`}>테스트 보조카드 선택</Link></section>}
      {hasClarifier && <button className="today-tarot-return-home" type="button" onClick={returnHome}>홈으로 가기<span aria-hidden="true">→</span></button>}
    </section><DestinyTarotFooter /></div><OrientationBottomSheet open={isOrientationSheetOpen} onClose={() => setIsOrientationSheetOpen(false)} /></main>;
}
