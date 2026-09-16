"use client";

import { useEffect, useState } from "react";
import type { MammusoCase } from "@/lib/cases/types";
import { statusLabel } from "@/lib/cases/types";
import { CaseResult } from "./CaseResult";
import { Hamji } from "./SiteChrome";

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
      } catch { /* 결과는 다음 자동 새로고침 때 다시 확인 */ }
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
    <ApplicantAccessLink />
    {error && <p className="error">{error}</p>}
    {!item.preliminaryResult ? <section className="paper case-flow-intro"><p className="eyebrow">1. 신청인 기록 정리</p><Hamji mood="paper" text="처음 적은 내용을 다시 보며, 빠뜨린 사실만 한 번 더 보태면 돼요." /><h2>접수 내용을 정리해볼까요?</h2><p>여러 질문에 나누어 답할 필요는 없습니다. 더 적을 내용이 없다면 바로 첫 조정 의견을 받아볼 수 있어요.</p><details className="statement-reference"><summary>내가 처음 접수한 이야기 다시 보기</summary><p>{item.complainantStatement}</p></details><label className="statement-addition-label" htmlFor="additional-statement">빠진 사실이나 덧붙이고 싶은 말 <small>선택</small></label><textarea id="additional-statement" value={additionalStatement} onChange={(event) => setAdditionalStatement(event.target.value)} maxLength={5000} placeholder="예: 그날 이후에 있었던 일, 당시의 사정, 꼭 함께 봐야 할 내용을 적어주세요." /><button className="button full" disabled={busy} onClick={() => request("/api/case/applicant", { token, answers: additionalStatement.trim() ? { "추가 진술": additionalStatement } : {} })}>{busy ? "검토 중…" : "첫 조정 의견 받기"}</button></section> : <>
      <section className="paper"><Hamji mood="serious" text="현재 의견은 신청인 진술만 기준으로 검토했습니다." /><h2>신청인 진술 기준 검토의견</h2><p>{item.preliminaryResult.summary}</p><h3>현재 확인된 내용</h3><ul>{item.preliminaryResult.knownFacts.map((v, i) => <li key={i}>{v}</li>)}</ul><h3>확인이 더 필요한 내용</h3><ul>{item.preliminaryResult.openQuestions.map((v, i) => <li key={i}>{v}</li>)}</ul><p className="advice">{item.preliminaryResult.opinion}</p><div className="clerk-note"><img className="clerk-mini" src="/illustrations/hamji-clerk.png" alt="" />{item.preliminaryResult.clerkComment}</div><small>현재 검토의견은 신청인의 진술만을 기준으로 작성되었습니다. 상대방의 실제 입장은 아직 확인되지 않았습니다.</small></section>
      {!item.finalResult && <section className="paper invite"><p className="eyebrow">2. 양쪽 이야기 듣기</p><h2>상대방에게 의견을 요청하세요</h2><p>한쪽 이야기만으로 결론을 내리지 않기 위해, 상대방도 자신의 기기에서 기억과 입장을 적을 수 있는 링크를 보냅니다. 상대방은 잘못이 정해진 사람이 아니며, 이 링크는 법적 소환이 아닙니다.</p>{!inviteUrl ? <button className="button full" disabled={busy} onClick={async () => { const data = await request("/api/case/invite", { token }); if (data?.inviteUrl) setInviteUrl(data.inviteUrl); }}>{busy ? "링크 만드는 중…" : "상대방 의견 요청 링크 만들기"}</button> : <InviteLink url={inviteUrl} />}</section>}
      {!item.finalResult && item.status === "AWAITING_RESPONDENT" && <section className="paper result-waiting"><Hamji mood="waiting" text="상대방의 독립 진술을 기다리고 있습니다." /><h2>상대방 의견을 기다리는 중이에요</h2><p>상대방이 진술을 제출하면 이 페이지가 자동으로 갱신되어 양측 조정결과를 보여드립니다. 이 페이지를 닫아도 아래 관리 링크를 다시 열면 결과를 확인할 수 있어요.</p></section>}
      {item.finalResult && <><CaseResult result={item.finalResult} caseNumber={item.publicCaseNumber} />{item.appealResult ? <CaseResult result={item.appealResult} caseNumber={item.publicCaseNumber} rehearing /> : <section className="paper appeal-request"><Hamji mood="surprised" text="어? 여기 사실이 조금 다르게 정리된 것 같은데요. 빠진 내용이 있다면 다른 재판장에게 다시 맡겨볼 수 있어요." /><p className="eyebrow">사건당 한 번</p><h2>다른 재판장에게 재심의 요청하기</h2><p>새 사실이나 잘못 이해된 부분을 적으면, 처음과 다른 성향의 재판장이 다시 읽고 조정 결과를 정리합니다.</p><textarea value={appealText} onChange={(e) => setAppealText(e.target.value)} minLength={10} placeholder="결과 중 어떤 부분이 사실과 다른지, 어떤 내용을 빠뜨렸는지 적어주세요." /><button className="button full" disabled={busy || appealText.length < 10} onClick={() => request("/api/case/appeal", { token, appealText })}>{busy ? "다른 재판장이 다시 읽는 중…" : "다른 재판장에게 재심의 요청하기"}</button></section>}</>}
    </>}
    <section className="paper danger-zone"><h2>사건 기록 삭제</h2><p>이 링크로 접속 가능한 사건의 진술, 결과, 이의신청 기록 전체를 즉시 삭제합니다. 삭제된 기록은 복구할 수 없습니다.</p><button className="text-button" type="button" disabled={busy} onClick={deleteCase}>이 사건 전체 삭제</button></section>
  </div>;
}

function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="invite-link"><input value={url} readOnly aria-label="상대방 의견 요청 링크" /><button className="button secondary" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); }}> {copied ? "복사됨" : "링크 복사"}</button>{typeof navigator !== "undefined" && "share" in navigator && <button className="text-button" onClick={() => navigator.share({ title: "맘무소 의견 요청", url })}>공유하기</button>}<small>보안상 이 링크는 지금 한 번만 표시됩니다. 다시 발급하면 이전 링크는 사용할 수 없게 됩니다.</small></div>;
}

function ApplicantAccessLink() {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(window.location.href); setCopied(true); };
  return <section className="applicant-access"><div><b>🔐 신청인 관리 링크</b><p>이 주소가 결과 확인 주소입니다. 홈페이지에서는 보안상 사건을 다시 찾을 수 없으니 저장해두세요.</p></div><button type="button" className="text-button" onClick={copy}>{copied ? "복사됨" : "링크 저장"}</button></section>;
}
