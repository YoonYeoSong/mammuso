"use client";

import { useEffect, useState } from "react";
import { symbolEmoji } from "@/lib/dream/scoring";
import type { DreamAnalysis, DreamExtracted, DreamReading, DreamTurn, DreamValue } from "@/lib/dream/types";

type Phase = "input" | "analyzing" | "followup" | "valuating" | "result";
type DreamResult = { reading: DreamReading; value: DreamValue; extracted: DreamExtracted };
type DreamMemory = "또렷해" | "조금 기억나" | "희미해";

const analysisLoadingSteps = ["꿈속에서 중요한 장면을 찾고 있어요.", "등장한 상징과 움직임을 살펴보고 있어요.", "다음에 물어볼 한 가지를 고르고 있어요."];
const valuationLoadingSteps = ["모은 꿈의 조각을 정리하고 있어요.", "말해준 장면의 흐름을 살펴보고 있어요.", "꿈값을 감정하고 있어요."];
const dreamMemoryOptions: DreamMemory[] = ["또렷해", "조금 기억나", "희미해"];

function Money({ amount }: { amount: number }) {
  return <strong className="dream-money">₩{amount.toLocaleString("ko-KR")}</strong>;
}

function StarRating({ rating }: { rating: number }) {
  return <div className="dream-rating" aria-label={`별점 ${rating.toFixed(1)}점 / 5점`}>
    <div className="dream-stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, rating - index));
        return <span key={index}><i style={{ width: `${fill * 100}%` }}>★</i>★</span>;
      })}
    </div>
    <b>{rating.toFixed(1)} / 5</b>
  </div>;
}

function keyPoints(extracted: DreamExtracted) {
  return [...extracted.symbols, ...extracted.actions, ...(extracted.ending ? [extracted.ending] : []), ...(extracted.emotion ? [extracted.emotion] : []), ...extracted.notableDetails]
    .filter((item, index, items) => items.indexOf(item) === index)
    .slice(0, 5);
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
  const [memory, setMemory] = useState<DreamMemory | null>(null);
  const [showMemoryPrompt, setShowMemoryPrompt] = useState(false);

  useEffect(() => {
    if (phase !== "analyzing" && phase !== "valuating") return;
    setLoadingIndex(0);
    const stepCount = phase === "analyzing" ? analysisLoadingSteps.length : valuationLoadingSteps.length;
    const timer = window.setInterval(() => setLoadingIndex((index) => (index + 1) % stepCount), 850);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "input") return;
    setShowMemoryPrompt(false);
    const timer = window.setTimeout(() => setShowMemoryPrompt(true), 320);
    return () => window.clearTimeout(timer);
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
    setPhase("input"); setDream(""); setTurns([]); setAnalysis(null); setAnswer(""); setResult(null); setError(""); setMemory(null);
  }

  if (phase === "analyzing" || phase === "valuating") return <section className="dream-shell dream-loading" aria-live="polite" aria-busy="true">
    <div className="dream-loader"><span>✦</span><i>₩</i><b>☁</b></div><p className="step">{phase === "analyzing" ? "DREAM DETAILS IN PROGRESS" : "DREAM VALUE IN PROGRESS"}</p><h1>{phase === "analyzing" ? "꿈의 조각을\n모으고 있어." : "꿈값을\n감정하고 있어."}</h1><p>{(phase === "analyzing" ? analysisLoadingSteps : valuationLoadingSteps)[loadingIndex]}</p><div className="loader-dots"><i /><i /><i /></div>
  </section>;

  if (phase === "followup" && analysis) return <section className="dream-shell dream-chat" aria-label="꿈값 추가 질문">
    <p className="step">DREAM CHAT · {turns.length + 1}/2</p><h1>딱 한 가지만<br />더 물어볼게.</h1>
    <div className="dream-thread">
      <div className="dream-message user"><span>내 꿈</span><p>{dream}</p></div>
      {turns.map((turn, index) => <div key={`${turn.question}-${index}`} className="dream-turn"><div className="dream-message bot"><span>꿈팔이</span><p>{turn.question}</p></div><div className="dream-message user"><p>{turn.answer}</p></div></div>)}
      <div className="dream-message bot"><span>꿈팔이</span><p>{analysis.followup.question}</p></div>
    </div>
    <div className="dream-options">{analysis.followup.options.map((option) => <button key={option} type="button" onClick={() => submitAnswer(option)}>{option}</button>)}</div>
    <label className="dream-answer"><span>직접 적을게</span><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="기억나는 만큼만 적어줘." maxLength={500} /><button type="button" className="dream-send" disabled={!answer.trim()} onClick={() => submitAnswer(answer)}>보내기 <span>↑</span></button></label>
    {error && <p className="request-error">{error} <button type="button" onClick={() => void analyze()}>다시 시도</button></p>}
  </section>;

  if (phase === "result" && result) {
    const points = keyPoints(result.extracted);
    return <section className="dream-shell dream-result">
      <div className="dream-value-card">
        <p>오늘의 꿈값</p><Money amount={result.value.amount} /><StarRating rating={result.value.rating} /><span className="dream-tier">{result.value.tier}</span><b>{result.value.label}</b><small>꿈값은 재미로 보는 가상 금액이에요.</small>
      </div>
      <section className="dream-detail dream-type"><p className="step">꿈 유형</p><h1>{result.reading.dreamType}</h1>{result.reading.typeExplanation && <p>{result.reading.typeExplanation}</p>}</section>
      <section className="dream-one-liner"><p>한줄 꿈풀이</p><strong>{result.reading.oneLiner}</strong></section>
      <section className="dream-detail dream-interpretation"><p className="step">꿈풀이</p><p>{result.reading.interpretation}</p></section>
      {points.length > 0 && <section className="dream-detail"><p className="step">꿈에서 중요한 포인트</p><div className="dream-tags">{points.map((item, index) => <span key={`${item}-${index}`}>{symbolEmoji(item)} {item}</span>)}</div></section>}
      <section className="dream-detail dream-why"><p className="step">왜 이 꿈값이에요?</p><p>{result.reading.valueExplanation}</p><div className="dream-factors">{result.value.factors.map((factor) => <span key={factor}>✦ {factor}</span>)}</div></section>
      <section className="dream-detail dream-suggestion"><p className="step">오늘은 이렇게</p><p>{result.reading.todaySuggestion}</p></section>
      <section className="dream-detail dream-suggestion"><p className="step">앞으로는 이렇게</p><p>{result.reading.futureSuggestion}</p></section>
      <button type="button" className="restart" onClick={restart}>다른 꿈 감정하기</button>
    </section>;
  }

  return <section className="dream-shell dream-chat dream-start-chat" aria-label="꿈값 대화 시작">
    <p className="step">꿈값 · 짧은 대화</p>
    <div className="dream-thread" aria-live="polite">
      <div className="dream-message bot chat-enter"><span>꿈팔이</span><p>어젯밤 꿈이구나. 같이 꿈값을 매겨보자.</p></div>
      {showMemoryPrompt && <div className="chat-enter chat-sequence-two">
        <div className="dream-message bot"><span>꿈팔이</span><p>지금 얼마나 기억나?</p></div>
        {!memory && <div className="dream-options" role="group" aria-label="꿈 기억 선명도">
          {dreamMemoryOptions.map((option) => <button key={option} type="button" onClick={() => setMemory(option)}>{option}</button>)}
        </div>}
      </div>}
      {memory && <div className="dream-message user chat-enter"><p>{memory}</p></div>}
      {memory && <div className="dream-message bot chat-enter"><span>꿈팔이</span><p>좋아. 기억나는 장면부터 들려줘.</p></div>}
    </div>
    {memory && <label className="dream-answer dream-first-answer chat-enter"><span>어젯밤의 꿈</span><textarea value={dream} onChange={(event) => setDream(event.target.value)} placeholder={"검은 고양이가 우리 집으로 들어왔는데\n내가 안아줬어. 기분은 좋았어."} maxLength={1500} /><small>{dream.length}/1500</small><button type="button" className="dream-send" disabled={!dream.trim()} onClick={() => void analyze()}>꿈 들려주기 <span>↑</span></button></label>}
    {error && <p className="request-error">{error} <button type="button" onClick={() => void analyze()}>다시 시도</button></p>}
    <p className="gentle-note">꿈 내용은 결과를 만드는 데에만 사용하며, 맘무소에 저장하지 않아요.</p>
  </section>;
}
