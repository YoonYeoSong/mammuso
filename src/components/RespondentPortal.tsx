"use client";

import { useState } from "react";
import Link from "next/link";
import type { MammusoCase } from "@/lib/cases/types";
import type { DecisionResult } from "@/lib/cases/types";
import { Hamji } from "./SiteChrome";
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

  if (result) return <><section className="paper centered"><Hamji mood="stamp" text="진술이 사건 기록에 접수되었습니다." /><h2>양측 진술 검토가 완료되었습니다.</h2><p>아래는 양측이 제출한 진술을 바탕으로 한 동일한 조정결과입니다.</p></section><CaseResult result={result} /></>;

  return <form className="paper form" onSubmit={submit}>
    <header className="flow-heading"><p className="eyebrow">관계 조정 절차 · 내 이야기 남기기</p><h2>당신의 이야기를 먼저 들려주세요.</h2><p>이 화면은 누가 맞고 틀렸는지 정하는 자리가 아닙니다. 서로의 기억을 차분히 비교하기 위한 첫 단계예요.</p></header>
    <Hamji mood="friendly" text="신청인의 원문 진술은 공개되지 않습니다. 먼저 이 요청을 받은 이유를 중립적으로 안내드릴게요." />
    <aside className="role-guide compact" aria-label="절차 용어 안내"><b>‘상대방’과 ‘의견 요청’의 뜻</b><p>상대방은 잘못이 정해진 사람이 아니라, 자신의 입장을 설명할 차례인 사람을 뜻합니다. 이 링크는 법원 소환이나 법적 의무가 아닌 의견 제출 안내입니다.</p></aside>
    <section className="case-panel respondent-notice">
      <p className="eyebrow">1. 이 요청을 받은 이유</p>
      <h2>이번 일은 무엇에 관한 건가요?</h2>
      <p>{item.neutralSummary || "신청인이 관계에서 의견 차이가 있었다고 접수한 건입니다."}</p>
      {item.neutralIssues.length > 0 && <ul>{item.neutralIssues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
      <small>이 안내는 신청인의 원문을 그대로 보여주지 않고, 상대방이 자신의 입장을 충분히 설명할 수 있도록 중립화한 요약입니다.</small>
    </section>
    <section className="case-panel independent-statement">
      <p className="eyebrow">2. 내가 기억하는 이야기</p>
      <h2>이 일은 어떻게 기억하시나요?</h2>
      <p>신청인의 주장에 맞춰 답할 필요는 없습니다. 기억나는 흐름, 당시 사정, 전하고 싶은 말을 자신의 관점에서 적어주세요.</p>
      <label htmlFor="respondent-statement">나의 입장</label>
      <textarea id="respondent-statement" value={statement} onChange={(event) => setStatement(event.target.value)} minLength={20} maxLength={5000} required placeholder="어떤 일이 있었는지, 당시 어떤 사정과 생각이 있었는지 자유롭게 적어주세요." />
    </section>
    <div className="privacy-guard"><b>개인정보 보호 안내</b><p>실명, 연락처, 주소, 주민등록번호, 대화 원문 전체, 제3자의 개인정보는 적지 마세요. 긴급한 안전 위험은 이 서비스 대신 112·119·109 등 전문 도움기관을 이용해야 합니다.</p></div>
    <section className="consent-block"><p className="eyebrow">3. 제출 전 확인</p><label className="consent"><input type="checkbox" checked={privacyPolicyAgreed} onChange={(event) => setPrivacyPolicyAgreed(event.target.checked)} required /> <span><Link href="/privacy" target="_blank">개인정보처리방침</Link>을 읽고, 사건 기록의 수집·이용에 동의합니다.</span></label><label className="consent"><input type="checkbox" checked={aiProcessingAgreed} onChange={(event) => setAiProcessingAgreed(event.target.checked)} required /> <span>조정 의견 생성을 위해 필요한 진술이 국외 AI 제공업체에 전송될 수 있음에 동의합니다.</span></label></section>
    {error && <p className="error">{error}</p>}
    <button className="button full" disabled={busy || !privacyPolicyAgreed || !aiProcessingAgreed}>{busy ? "양측 기록을 비교 중입니다…" : "내 진술 제출하기"}</button>
  </form>;
}
