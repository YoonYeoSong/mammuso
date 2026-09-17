"use client";

import { useState } from "react";
import Link from "next/link";
import { type DecisionResult, type MammusoCase } from "@/lib/cases/types";
import { SPICY_MODE_CONSENT_KEY } from "@/lib/cases/types";
import { CaseResult } from "./CaseResult";

export function RespondentPortal({ item, token }: { item: MammusoCase; token: string }) {
  const [statement, setStatement] = useState(item.respondentStatement ?? "");
  const [privacyPolicyAgreed, setPrivacyPolicyAgreed] = useState(false);
  const [aiProcessingAgreed, setAiProcessingAgreed] = useState(false);
  const [spicyModeAgreed, setSpicyModeAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DecisionResult | null>(item.finalResult);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/case/respondent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, statement, answers: {}, privacyPolicyAgreed, aiProcessingAgreed, spicyModeAgreed }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setResult(data.case.finalResult);
    } catch (error) { setError(error instanceof Error ? error.message : "제출에 실패했습니다."); }
    finally { setBusy(false); }
  }

  if (result) return <CaseResult result={result} caseNumber={item.publicCaseNumber} />;

  const spicyRequested = item.complainantAnswers[SPICY_MODE_CONSENT_KEY] === "동의";

  return <form className="paper form" onSubmit={submit}>
    <header className="flow-heading"><p className="eyebrow">의견 제출</p><h2>이 사건을 어떻게 기억하나요?</h2></header>
    <section className="case-panel respondent-notice"><p className="eyebrow">사건 내용</p><p>{item.neutralSummary || "관계에서 있었던 의견 차이에 관한 요청입니다."}</p><small>누군가 이 내용에 대한 의견 제출을 요청했습니다.</small></section>
    <section className="independent-statement"><label htmlFor="respondent-statement">내가 기억하는 내용</label><p className="field-intro">사실과 당시 상황을 자유롭게 적어주세요.</p><textarea id="respondent-statement" value={statement} onChange={(event) => setStatement(event.target.value)} minLength={20} maxLength={5000} required placeholder="예: 그날 어떤 일이 있었는지, 왜 그렇게 행동했는지 적어주세요." /></section>
    <small className="privacy-short">실명·연락처 등 개인정보는 적지 마세요.</small>
    <section className="consent-block"><label className="consent"><input type="checkbox" checked={privacyPolicyAgreed} onChange={(event) => setPrivacyPolicyAgreed(event.target.checked)} required /> <span><Link href="/privacy" target="_blank">개인정보처리방침</Link>에 동의합니다.</span></label><label className="consent"><input type="checkbox" checked={aiProcessingAgreed} onChange={(event) => setAiProcessingAgreed(event.target.checked)} required /> <span>AI 처리에 필요한 진술 전송에 동의합니다.</span></label>{spicyRequested && <label className="consent spicy-consent"><input type="checkbox" checked={spicyModeAgreed} onChange={(event) => setSpicyModeAgreed(event.target.checked)} /> <span>강한 표현이 포함된 매운맛 결과에 동의합니다.</span></label>}</section>
    {error && <p className="error">{error}</p>}
    <button className="button full" disabled={busy || !privacyPolicyAgreed || !aiProcessingAgreed}>{busy ? "결론 정리 중…" : "의견 제출하기"}</button>
  </form>;
}
