"use client";

import Link from "next/link";
import { useState } from "react";
import { brand } from "@/lib/brand";

export default function Home() {
  const [notice, setNotice] = useState("");
  const comingSoon = [
    ["행운 뽑기", "오늘의 작은 행운을 골라봐.", "feature-art-luck"],
    ["마음 수첩", "오늘의 기분을 차곡차곡 모아봐.", "feature-art-diary"],
  ];
  return <main className="home-page">
    <header className="new-header home-header"><span className="header-pixel-logo">{brand.name}</span><span>오늘의 작은 마음 놀이</span></header>
    <section className="new-hero home-world"><div className="hero-copy"><p>WELCOME TO MAMMUSO</p><h1>{brand.tagline}</h1><span className="hero-speech">좋은 일이 생길 거예요!</span></div><Link href="/tarot" className="today-tarot" aria-label="오늘의 타로 보러가기"><span>오늘의 타로</span><b>THE STAR</b><i>✦</i></Link><span className="hero-orbit orbit-one" /><span className="hero-orbit orbit-two" /></section>
    <section className="content-list" aria-labelledby="content-title"><div className="section-heading"><p>오늘, 뭘 볼까?</p><h2 id="content-title">마음 가는 걸<br />하나 골라봐.</h2></div>
      <div className="home-menu-grid">
        <Link href="/dream" className="content-card menu-tile menu-tile-dream"><span className="feature-art feature-art-dream" aria-hidden="true" /><span><b>오늘의 꿈풀이</b><small>어젯밤 꿈, 얼마일까?</small></span></Link>
        <Link href="/tarot" className="content-card menu-tile menu-tile-tarot"><span className="feature-art feature-art-tarot" aria-hidden="true" /><span><b>타로 보기</b><small>끌리는 카드 세 장</small></span></Link>
        {comingSoon.map(([title, copy, artClass]) => <button key={title} className="content-card menu-tile" onClick={() => setNotice(`${title}, 열심히 준비 중이에요.`)} aria-label={`${title}, 준비 중`}><span className={`feature-art ${artClass}`} aria-hidden="true" /><span><b>{title}</b><small>{copy}</small></span></button>)}
      </div>
      {notice && <p className="coming-notice" role="status">{notice}</p>}
    </section>
    <footer className="new-footer"><span>{brand.shortDescription}</span><nav><Link href="/privacy">개인정보처리방침</Link><Link href="/terms">이용안내</Link></nav></footer>
  </main>;
}
