"use client";

import { useEffect, useState } from "react";
import { SPICY_MODE_CONSENT_KEY, type MammusoCase, statusLabel } from "@/lib/cases/types";
import { CaseResult } from "./CaseResult";

export function ApplicantPortal({ initialCase, token }: { initialCase: MammusoCase; token: string }) {
  const [item, setItem] = useState(initialCase);
  const [additionalStatement, setAdditionalStatement] = useState(initialCase.complainantAnswers["추가 진술"] ?? "");
  const [inviteUrl, setInviteUrl] = useState("");
  const [appealText, setAppealText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item.finalResult || item.status !== "AWAITING_RESPONDENT") return;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/case/applicant?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = await response.json();
        if (response.ok && data.case) setItem(data.case);
      } catch { /* 다음 자동 새로고침 때 다시 확인 */ }
    };
    const intervalId = window.setInterval(refresh, 12000);
    return () => window.clearInterval(intervalId);
  }, [item.finalResult, item.status, token]);

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
    if (!window.confirm("이 사건 기록을 모두 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/case/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      window.location.assign("/");
    } catch (e) { setError(e instanceof Error ? e.message : "삭제 요청을 처리하지 못했습니다."); }
    finally { setBusy(false); }
  }

  if (item.safetyLevel === "urgent") return <section className="paper safety"><h2>일반 조정을 멈춥니다</h2><p>지금 위험하다면 112·119·109 등 전문 도움기관에 먼저 연락하세요.</p></section>;

  return <div className="portal">
    <section className="case-banner"><p className="eyebrow">접수번호</p><h1>{item.publicCaseNumber}</h1><div><span className="status">{statusLabel[item.status]}</span></div></section>
    <ApplicantAccessLink />
    {error && <p className="error">{error}</p>}
    {!item.preliminaryResult ? <section className="paper case-flow-intro"><p className="eyebrow">추가 내용</p><h2>더 적을 내용이 있나요?</h2><details className="statement-reference"><summary>처음 적은 내용 보기</summary><p>{item.complainantStatement}</p></details><label className="statement-addition-label" htmlFor="additional-statement">빠진 사실 <small>선택</small></label><textarea id="additional-statement" value={additionalStatement} onChange={(event) => setAdditionalStatement(event.target.value)} maxLength={5000} placeholder="빠진 사실만 적어주세요." /><button className="button full" disabled={busy} onClick={() => request("/api/case/applicant", { token, answers: additionalStatement.trim() ? { "추가 진술": additionalStatement } : {} })}>{busy ? "검토 중…" : "결과 보기"}</button></section> : <>
      <section className="paper preliminary-result"><p className="eyebrow">내 진술 기준</p><h2>현재 정리</h2><p>{item.preliminaryResult.summary}</p><p className="advice">{item.preliminaryResult.opinion}</p><details className="statement-reference"><summary>확인한 내용 보기</summary>{item.preliminaryResult.knownFacts.length > 0 && <ul>{item.preliminaryResult.knownFacts.map((fact, index) => <li key={index}>{fact}</li>)}</ul>}{item.preliminaryResult.openQuestions.length > 0 && <><b>더 확인할 내용</b><ul>{item.preliminaryResult.openQuestions.map((question, index) => <li key={index}>{question}</li>)}</ul></>}</details></section>
      {!item.finalResult && <section className="paper invite"><p className="eyebrow">다음 단계</p><h2>상대방 의견 요청</h2><p>상대방이 자기 입장을 적을 수 있는 링크입니다.</p>{!inviteUrl ? <button className="button full" disabled={busy} onClick={async () => { const data = await request("/api/case/invite", { token }); if (data?.inviteUrl) setInviteUrl(data.inviteUrl); }}>{busy ? "링크 만드는 중…" : "링크 만들기"}</button> : <InviteLink url={inviteUrl} />}</section>}
      {!item.finalResult && item.status === "AWAITING_RESPONDENT" && <section className="paper result-waiting"><h2>상대방 의견 대기 중</h2><p>제출되면 결과가 여기 표시됩니다.</p></section>}
      {item.finalResult && <><CaseResult result={item.finalResult} caseNumber={item.publicCaseNumber} spicyMode={item.complainantAnswers[SPICY_MODE_CONSENT_KEY] === "동의" && item.respondentAnswers[SPICY_MODE_CONSENT_KEY] === "동의"} respondentStatement={item.respondentStatement} />{item.appealResult ? <CaseResult result={item.appealResult} caseNumber={item.publicCaseNumber} rehearing spicyMode={item.complainantAnswers[SPICY_MODE_CONSENT_KEY] === "동의" && item.respondentAnswers[SPICY_MODE_CONSENT_KEY] === "동의"} respondentStatement={item.respondentStatement} /> : <section className="paper appeal-request"><p className="eyebrow">재심의</p><h2>다시 검토 요청</h2><p>빠진 사실이나 잘못된 부분만 적어주세요.</p><textarea value={appealText} onChange={(e) => setAppealText(e.target.value)} minLength={10} placeholder="다시 봐야 할 내용을 적어주세요." /><button className="button full" disabled={busy || appealText.length < 10} onClick={() => request("/api/case/appeal", { token, appealText })}>{busy ? "검토 중…" : "다시 검토 요청"}</button></section>}</>}
    </>}
    <section className="paper danger-zone"><h2>기록 삭제</h2><p>삭제 후 복구할 수 없습니다.</p><button className="text-button" type="button" disabled={busy} onClick={deleteCase}>이 사건 삭제</button></section>
  </div>;
}

function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="invite-link"><input value={url} readOnly aria-label="상대방 의견 요청 링크" /><button className="button secondary" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); }}>{copied ? "복사됨" : "링크 복사"}</button>{typeof navigator !== "undefined" && "share" in navigator && <button className="text-button" onClick={() => navigator.share({ title: "맘무소 의견 요청", url })}>공유</button>}<small>링크는 지금 한 번만 표시됩니다.</small></div>;
}

function ApplicantAccessLink() {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(window.location.href); setCopied(true); };
  return <section className="applicant-access"><div><b>관리 링크</b><p>결과 확인 주소입니다.</p></div><button type="button" className="text-button" onClick={copy}>{copied ? "복사됨" : "링크 저장"}</button></section>;
}
