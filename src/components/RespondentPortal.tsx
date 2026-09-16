"use client";

import { useState } from "react";
import Link from "next/link";
import type { DecisionResult, MammusoCase } from "@/lib/cases/types";
import { CaseResult } from "./CaseResult";

export function RespondentPortal({ item, token }: { item: MammusoCase; token: string }) {
  const [statement, setStatement] = useState(item.respondentStatement ?? "");
  const [privacyPolicyAgreed, setPrivacyPolicyAgreed] = useState(false);
  const [aiProcessingAgreed, setAiProcessingAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DecisionResult | null>(item.finalResult);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/case/respondent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, statement, answers: {}, privacyPolicyAgreed, aiProcessingAgreed }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setResult(data.case.finalResult);
    } catch (error) { setError(error instanceof Error ? error.message : "제출에 실패했습니다."); }
    finally { setBusy(false); }
  }

  if (result) return <CaseResult result={result} caseNumber={item.publicCaseNumber} />;

  return <form className="paper form" onSubmit={submit}>
    <header className="flow-heading"><p className="eyebrow">의견 작성</p><h2>내 이야기를 적어주세요.</h2></header>
    <section className="case-panel respondent-notice"><p className="eyebrow">요청 내용</p><p>{item.neutralSummary || "관계에서 있었던 의견 차이에 관한 요청입니다."}</p></section>
    <section className="independent-statement"><label htmlFor="respondent-statement">내가 기억하는 일</label><p>사실과 당시 상황만 적어주세요.</p><textarea id="respondent-statement" value={statement} onChange={(event) => setStatement(event.target.value)} minLength={20} maxLength={5000} required placeholder="무슨 일이 있었는지 적어주세요." /></section>
    <small className="privacy-short">실명·연락처 등 개인정보는 적지 마세요.</small>
    <section className="consent-block"><label className="consent"><input type="checkbox" checked={privacyPolicyAgreed} onChange={(event) => setPrivacyPolicyAgreed(event.target.checked)} required /> <span><Link href="/privacy" target="_blank">개인정보처리방침</Link>에 동의합니다.</span></label><label className="consent"><input type="checkbox" checked={aiProcessingAgreed} onChange={(event) => setAiProcessingAgreed(event.target.checked)} required /> <span>AI 처리에 필요한 진술 전송에 동의합니다.</span></label></section>
    {error && <p className="error">{error}</p>}
    <button className="button full" disabled={busy || !privacyPolicyAgreed || !aiProcessingAgreed}>{busy ? "결과 정리 중…" : "제출하기"}</button>
  </form>;
}
