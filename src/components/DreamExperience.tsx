"use client";

import { useEffect, useState } from "react";
import { symbolEmoji } from "@/lib/dream/scoring";
import type { DreamAnalysis, DreamExtracted, DreamReading, DreamTurn, DreamValue } from "@/lib/dream/types";

type Phase = "input" | "analyzing" | "followup" | "valuating" | "result";
type DreamResult = { reading: DreamReading; value: DreamValue; extracted: DreamExtracted };

const loadingSteps = ["꿈속에서 중요한 장면을 찾고 있어요.", "등장한 상징과 움직임을 살펴보고 있어요.", "말해준 장면 안에서 꿈값을 감정하고 있어요."];

function Money({ amount }: { amount: number }) {
  return <strong className="dream-money">₩{amount.toLocaleString("ko-KR")}</strong>;
}

export function DreamExperience() {
  const [phase, setPhase] = useState<Phase>("input");
  const [dream, setDream] = useState("");
  const [turns, setTurns] = useState<DreamTurn[]>([]);
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<DreamResult | null>(null);
  const [error, setError] = useState("");
  const [loadingIndex, setLoadingIndex] = useState(0);

  useEffect(() => {
    if (phase !== "analyzing" && phase !== "valuating") return;
    setLoadingIndex(0);
    const timer = window.setInterval(() => setLoadingIndex((index) => (index + 1) % loadingSteps.length), 850);
    return () => window.clearInterval(timer);
  }, [phase]);

  async function requestResult(extracted: DreamExtracted, currentTurns = turns) {
    setPhase("valuating");
    setError("");
    try {
      const response = await fetch("/api/dream/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dream, turns: currentTurns, extracted }) });
      const data = await response.json() as { reading?: DreamReading; value?: DreamValue; message?: string };
      if (!response.ok || !data.reading || !data.value) throw new Error(data.message || "꿈값을 감정하지 못했어요.");
      setResult({ reading: data.reading, value: data.value, extracted });
      window.setTimeout(() => setPhase("result"), 360);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "처리 중 문제가 생겼어요.");
      setPhase(analysis?.status === "NEEDS_FOLLOWUP" ? "followup" : "input");
    }
  }

  async function analyze(nextTurns = turns) {
    if (!dream.trim()) return;
    setPhase("analyzing");
    setError("");
    try {
      const response = await fetch("/api/dream/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dream, turns: nextTurns }) });
      const data = await response.json() as { analysis?: DreamAnalysis; message?: string };
      if (!response.ok || !data.analysis) throw new Error(data.message || "꿈 이야기를 정리하지 못했어요.");
      setAnalysis(data.analysis);
      if (data.analysis.status === "NEEDS_FOLLOWUP" && nextTurns.length < 2 && data.analysis.followup.question) {
        setPhase("followup");
      } else {
        await requestResult(data.analysis.extracted, nextTurns);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "처리 중 문제가 생겼어요.");
      setPhase(nextTurns.length ? "followup" : "input");
    }
  }

  function submitAnswer(value: string) {
    const clean = value.trim();
    if (!clean || !analysis?.followup.question) return;
    const nextTurns = [...turns, { question: analysis.followup.question, answer: clean }];
    setTurns(nextTurns);
    setAnswer("");
    void analyze(nextTurns);
  }

  function restart() {
    setPhase("input"); setDream(""); setTurns([]); setAnalysis(null); setAnswer(""); setResult(null); setError("");
  }

  if (phase === "analyzing" || phase === "valuating") return <section className="dream-shell dream-loading" aria-live="polite" aria-busy="true">
    <div className="dream-loader"><span>✦</span><i>₩</i><b>☁</b></div><p className="step">DREAM VALUE IN PROGRESS</p><h1>{phase === "analyzing" ? "꿈의 조각을\n모으고 있어." : "꿈값을\n감정하고 있어."}</h1><p>{loadingSteps[loadingIndex]}</p><div className="loader-dots"><i /><i /><i /></div>
  </section>;

  if (phase === "followup" && analysis) return <section className="dream-shell dream-chat" aria-label="꿈값 추가 질문">
    <p className="step">DREAM CHAT · {turns.length + 1}/2</p><h1>딱 한 가지만<br />더 물어볼게.</h1>
    <div className="dream-thread">
      <div className="dream-message user"><span>내 꿈</span><p>{dream}</p></div>
      {turns.map((turn, index) => <div key={`${turn.question}-${index}`} className="dream-turn"><div className="dream-message bot"><span>꿈값</span><p>{turn.question}</p></div><div className="dream-message user"><p>{turn.answer}</p></div></div>)}
      <div className="dream-message bot"><span>꿈값</span><p>{analysis.followup.question}</p></div>
    </div>
    <div className="dream-options">{analysis.followup.options.map((option) => <button key={option} type="button" onClick={() => submitAnswer(option)}>{option}</button>)}</div>
    <label className="dream-answer"><span>직접 적을게</span><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="기억나는 만큼만 적어줘." maxLength={500} /><button type="button" className="dream-send" disabled={!answer.trim()} onClick={() => submitAnswer(answer)}>보내기 <span>↑</span></button></label>
    {error && <p className="request-error">{error} <button type="button" onClick={() => void analyze()}>다시 시도</button></p>}
  </section>;

  if (phase === "result" && result) {
    const symbols = [...result.extracted.symbols, ...result.extracted.actions].slice(0, 5);
    return <section className="dream-shell dream-result">
      <div className="dream-value-card">
        <p>어젯밤 당신의 꿈값은</p><Money amount={result.value.amount} /><b>{result.value.label}</b><small>꿈값은 재미로 보는 가상 금액이에요.</small>
      </div>
      <section className="dream-detail"><p className="step">꿈 한 줄 요약</p><h1>{result.reading.summary}</h1></section>
      {symbols.length > 0 && <section className="dream-detail"><p className="step">꿈에서 발견한 핵심 장면</p><div className="dream-tags">{symbols.map((item, index) => <span key={`${item}-${index}`}>{symbolEmoji(item)} {item}</span>)}</div></section>}
      {result.extracted.fortuneDomains.length > 0 && <section className="dream-detail"><p className="step">가장 강하게 연결되는 영역</p><div className="dream-domains">{result.extracted.fortuneDomains.map((domain, index) => <span key={domain}><i style={{ width: `${Math.max(42, 100 - index * 18)}%` }} /><b>{domain}</b></span>)}</div></section>}
      <section className="dream-detail dream-why"><p className="step">왜 이 가격이에요?</p><p>{result.reading.valueExplanation}</p></section>
      <section className="dream-detail dream-interpretation"><p className="step">꿈풀이</p><p>{result.reading.interpretation}</p></section>
      <section className="dream-one-liner"><p>한마디로</p><strong>{result.reading.oneLiner}</strong></section>
      <button type="button" className="restart" onClick={restart}>다른 꿈 감정하기</button>
    </section>;
  }

  return <section className="dream-shell dream-input">
    <p className="step">DREAM VALUE · FREE</p><h1>무슨 꿈 꿨어?</h1><p className="dream-intro">기억나는 만큼만 말해줘.<br />짧게 적어도 괜찮아. 내가 더 물어볼게.</p>
    <label className="dream-story"><span>어젯밤의 꿈</span><textarea value={dream} onChange={(event) => setDream(event.target.value)} placeholder={"검은 고양이가 우리 집으로 들어왔는데\n내가 안아줬어. 기분은 좋았어."} maxLength={1500} /><small>{dream.length}/1500</small></label>
    <button type="button" className="primary-action" disabled={!dream.trim()} onClick={() => void analyze()}>내 꿈 얼마짜리인지 보기 <span>→</span></button>
    {error && <p className="request-error">{error} <button type="button" onClick={() => void analyze()}>다시 시도</button></p>}
    <p className="gentle-note">꿈 내용은 결과를 만드는 데에만 사용하며, 맘무소에 저장하지 않아요.</p>
  </section>;
}
