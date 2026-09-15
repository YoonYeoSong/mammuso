"use client";

import { useState } from "react";
import type { MammusoCase } from "@/lib/cases/types";
import { statusLabel } from "@/lib/cases/types";
import { CaseResult } from "./CaseResult";
import { Hamji } from "./SiteChrome";

export function ApplicantPortal({ initialCase, token }: { initialCase: MammusoCase; token: string }) {
  const [item, setItem] = useState(initialCase);
  const [answers, setAnswers] = useState<Record<string, string>>(initialCase.complainantAnswers);
  const [inviteUrl, setInviteUrl] = useState("");
  const [appealText, setAppealText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function request(path: string, body: object) {
    setBusy(true); setError("");
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (data.case) setItem(data.case);
      return data;
    } catch (e) { setError(e instanceof Error ? e.message : "처리에 실패했습니다."); }
    finally { setBusy(false); }
  }

  async function deleteCase() {
    if (!window.confirm("이 사건의 진술, 결과, 이의신청 기록을 모두 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/case/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      window.location.assign("/");
    } catch (e) { setError(e instanceof Error ? e.message : "삭제 요청을 처리하지 못했습니다."); }
    finally { setBusy(false); }
  }

  if (item.safetyLevel === "urgent") return <section className="paper safety"><h2>일반 조정 절차를 잠시 멈춥니다</h2><p>신체 안전과 관련된 표현이 감지되었습니다. 지금 위험하다면 지역 긴급전화 또는 전문기관의 도움을 먼저 받아주세요. 한국에서는 112(경찰), 119(구급), 자살예방 상담 109를 이용할 수 있습니다.</p></section>;

  return <div className="portal">
    <section className="case-banner"><p className="eyebrow">접수번호</p><h1>{item.publicCaseNumber}</h1><div><span>관계분쟁조정과</span><span className="status">{statusLabel[item.status]}</span></div></section>
    {error && <p className="error">{error}</p>}
    {!item.preliminaryResult ? <section className="paper"><Hamji mood="paper" text="제출하신 내용을 바탕으로 사실관계를 확인하겠습니다. 답변은 아는 범위에서만 적어주세요." /><h2>추가 사실확인</h2><AnswerFields questions={item.applicantQuestions} answers={answers} onChange={setAnswers} /><button className="button full" disabled={busy} onClick={() => request("/api/case/applicant", { token, answers })}>{busy ? "검토 중…" : "추가진술 제출"}</button></section> : <>
      <section className="paper"><Hamji mood="serious" text="현재 의견은 신청인 진술만 기준으로 검토했습니다." /><h2>신청인 진술 기준 검토의견</h2><p>{item.preliminaryResult.summary}</p><h3>현재 확인된 내용</h3><ul>{item.preliminaryResult.knownFacts.map((v, i) => <li key={i}>{v}</li>)}</ul><h3>확인이 더 필요한 내용</h3><ul>{item.preliminaryResult.openQuestions.map((v, i) => <li key={i}>{v}</li>)}</ul><p className="advice">{item.preliminaryResult.opinion}</p><div className="clerk-note">🐹 {item.preliminaryResult.clerkComment}</div><small>현재 검토의견은 신청인의 진술만을 기준으로 작성되었습니다. 상대방의 실제 입장은 아직 확인되지 않았습니다.</small></section>
      {!item.finalResult && <section className="paper invite"><h2>상대방 출석요구서</h2><p>맘무소는 한쪽의 진술만으로 사건을 처리하지 않습니다. 상대방이 자신의 기기에서 독립적으로 의견을 제출할 수 있도록 출석 링크를 발급하세요.</p>{!inviteUrl ? <button className="button full" disabled={busy} onClick={async () => { const data = await request("/api/case/invite", { token }); if (data?.inviteUrl) setInviteUrl(data.inviteUrl); }}>{busy ? "발급 중…" : "상대방 출석요구서 발급"}</button> : <InviteLink url={inviteUrl} />}</section>}
      {item.finalResult && <><CaseResult result={item.finalResult} />{item.appealResult ? <CaseResult result={item.appealResult} rehearing /> : <section className="paper"><Hamji mood="surprised" text="빠뜨린 사실이나 잘못 이해된 부분이 있다면, 사건당 한 번 재심의를 접수할 수 있어요." /><h2>이의신청</h2><textarea value={appealText} onChange={(e) => setAppealText(e.target.value)} minLength={10} placeholder="결과 중 어떤 부분이 사실과 다른지, 어떤 내용을 빠뜨렸는지 적어주세요." /><button className="button full" disabled={busy || appealText.length < 10} onClick={() => request("/api/case/appeal", { token, appealText })}>{busy ? "김햄찌 주무관이 재심의 중입니다…" : "이의신청 접수"}</button></section>}</>}
    </>}
    <section className="paper danger-zone"><h2>사건 기록 삭제</h2><p>이 링크로 접속 가능한 사건의 진술, 결과, 이의신청 기록 전체를 즉시 삭제합니다. 삭제된 기록은 복구할 수 없습니다.</p><button className="text-button" type="button" disabled={busy} onClick={deleteCase}>이 사건 전체 삭제</button></section>
  </div>;
}

function AnswerFields({ questions, answers, onChange }: { questions: string[]; answers: Record<string, string>; onChange: (value: Record<string, string>) => void }) {
  return <>{questions.map((question, index) => <label className="question" key={question}><b>{index + 1}. {question}</b><textarea value={answers[question] ?? ""} onChange={(e) => onChange({ ...answers, [question]: e.target.value })} required /></label>)}</>;
}

function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="invite-link"><input value={url} readOnly aria-label="상대방 출석 링크" /><button className="button secondary" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); }}> {copied ? "복사됨" : "링크 복사"}</button>{typeof navigator !== "undefined" && "share" in navigator && <button className="text-button" onClick={() => navigator.share({ title: "맘무소 출석요구", url })}>공유하기</button>}<small>보안상 이 링크는 지금 한 번만 표시됩니다. 다시 발급하면 이전 링크는 사용할 수 없게 됩니다.</small></div>;
}
