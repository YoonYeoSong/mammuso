"use client";

import Link from "next/link";
import { useState } from "react";
import { brand } from "@/lib/brand";

export default function Home() {
  const [notice, setNotice] = useState("");
  const comingSoon = [
    ["오늘점", "오늘 하루, 뭐가 기다리고 있을까?", "☼"], ["될까?", "그거 진짜 될지 한번 볼까?", "?"], ["꿈값", "어젯밤 그 꿈, 얼마짜리였을까?", "☁"], ["궁합", "우리 둘, 얼마나 맞을까?", "♡"], ["시비점", "그래서 누구 잘못이 더 큰데?", "↯"],
  ];
  return <main className="home-page">
    <header className="new-header"><Link href="/" className="new-brand">{brand.name}</Link><span>가볍게 보는 오늘의 마음</span></header>
    <section className="new-hero"><p>AI FORTUNE PLAYGROUND</p><h1>{brand.tagline}</h1><span className="hero-orbit orbit-one" /><span className="hero-orbit orbit-two" /></section>
    <section className="content-list" aria-labelledby="content-title"><div className="section-heading"><p>오늘, 뭘 볼까?</p><h2 id="content-title">마음 가는 걸<br />하나 골라봐.</h2></div>
      <Link href="/tarot" className="content-card tarot-home-card"><div className="content-icon tarot-icon">✦</div><div><div className="status-line"><span>OPEN</span><small>FREE</small></div><h3>타로</h3><p>고민 하나 생각하고<br />끌리는 카드를 직접 골라보세요.</p></div><i>→</i></Link>
      <div className="coming-grid">{comingSoon.map(([title, copy, icon]) => <button key={title} className="content-card coming-card" onClick={() => setNotice(`${title}, 열심히 준비 중이에요.`)} aria-label={`${title}, 준비 중`}><span className="content-icon">{icon}</span><div><small>COMING SOON</small><h3>{title}</h3><p>{copy}</p></div></button>)}</div>
      {notice && <p className="coming-notice" role="status">{notice}</p>}
    </section>
    <footer className="new-footer"><span>{brand.shortDescription}</span><nav><Link href="/privacy">개인정보처리방침</Link><Link href="/terms">이용안내</Link></nav></footer>
  </main>;
}
