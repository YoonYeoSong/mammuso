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
    {!item.preliminaryResult ? <section className="paper"><Hamji mood="paper" text="여러 질문에 나누어 답할 필요 없이, 추가로 적고 싶은 사실만 한 번에 적어주세요." /><h2>추가 진술서</h2><p>처음 작성한 내용에 덧붙일 사실, 당시의 상황, 상대방에게 전하고 싶은 설명이 있다면 자유롭게 적어주세요. 없으면 바로 검토를 요청해도 됩니다.</p><textarea value={additionalStatement} onChange={(event) => setAdditionalStatement(event.target.value)} maxLength={5000} placeholder="추가로 설명하고 싶은 내용을 자유롭게 적어주세요. (선택)" /><button className="button full" disabled={busy} onClick={() => request("/api/case/applicant", { token, answers: additionalStatement.trim() ? { "추가 진술": additionalStatement } : {} })}>{busy ? "검토 중…" : "이 내용으로 검토 요청하기"}</button></section> : <>
      <section className="paper"><Hamji mood="serious" text="현재 의견은 신청인 진술만 기준으로 검토했습니다." /><h2>신청인 진술 기준 검토의견</h2><p>{item.preliminaryResult.summary}</p><h3>현재 확인된 내용</h3><ul>{item.preliminaryResult.knownFacts.map((v, i) => <li key={i}>{v}</li>)}</ul><h3>확인이 더 필요한 내용</h3><ul>{item.preliminaryResult.openQuestions.map((v, i) => <li key={i}>{v}</li>)}</ul><p className="advice">{item.preliminaryResult.opinion}</p><div className="clerk-note"><img className="clerk-mini" src="/illustrations/hamji-clerk.png" alt="" />{item.preliminaryResult.clerkComment}</div><small>현재 검토의견은 신청인의 진술만을 기준으로 작성되었습니다. 상대방의 실제 입장은 아직 확인되지 않았습니다.</small></section>
      {!item.finalResult && <section className="paper invite"><h2>상대방 출석요구서</h2><p>맘무소는 한쪽의 진술만으로 사건을 처리하지 않습니다. 상대방이 자신의 기기에서 독립적으로 의견을 제출할 수 있도록 출석 링크를 발급하세요.</p>{!inviteUrl ? <button className="button full" disabled={busy} onClick={async () => { const data = await request("/api/case/invite", { token }); if (data?.inviteUrl) setInviteUrl(data.inviteUrl); }}>{busy ? "발급 중…" : "상대방 출석요구서 발급"}</button> : <InviteLink url={inviteUrl} />}</section>}
      {!item.finalResult && item.status === "AWAITING_RESPONDENT" && <section className="paper result-waiting"><Hamji mood="waiting" text="상대방의 독립 진술을 기다리고 있습니다." /><h2>상대방 의견을 기다리는 중이에요</h2><p>상대방이 진술을 제출하면 이 페이지가 자동으로 갱신되어 양측 조정결과를 보여드립니다. 이 페이지를 닫아도 아래 관리 링크를 다시 열면 결과를 확인할 수 있어요.</p></section>}
      {item.finalResult && <><CaseResult result={item.finalResult} />{item.appealResult ? <CaseResult result={item.appealResult} rehearing /> : <section className="paper"><Hamji mood="surprised" text="빠뜨린 사실이나 잘못 이해된 부분이 있다면, 사건당 한 번 재심의를 접수할 수 있어요." /><h2>이의신청</h2><textarea value={appealText} onChange={(e) => setAppealText(e.target.value)} minLength={10} placeholder="결과 중 어떤 부분이 사실과 다른지, 어떤 내용을 빠뜨렸는지 적어주세요." /><button className="button full" disabled={busy || appealText.length < 10} onClick={() => request("/api/case/appeal", { token, appealText })}>{busy ? "김햄찌 주무관이 재심의 중입니다…" : "이의신청 접수"}</button></section>}</>}
    </>}
    <section className="paper danger-zone"><h2>사건 기록 삭제</h2><p>이 링크로 접속 가능한 사건의 진술, 결과, 이의신청 기록 전체를 즉시 삭제합니다. 삭제된 기록은 복구할 수 없습니다.</p><button className="text-button" type="button" disabled={busy} onClick={deleteCase}>이 사건 전체 삭제</button></section>
  </div>;
}

function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="invite-link"><input value={url} readOnly aria-label="상대방 출석 링크" /><button className="button secondary" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); }}> {copied ? "복사됨" : "링크 복사"}</button>{typeof navigator !== "undefined" && "share" in navigator && <button className="text-button" onClick={() => navigator.share({ title: "맘무소 출석요구", url })}>공유하기</button>}<small>보안상 이 링크는 지금 한 번만 표시됩니다. 다시 발급하면 이전 링크는 사용할 수 없게 됩니다.</small></div>;
}

function ApplicantAccessLink() {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(window.location.href); setCopied(true); };
  return <section className="applicant-access"><div><b>🔐 신청인 관리 링크</b><p>이 주소가 결과 확인 주소입니다. 홈페이지에서는 보안상 사건을 다시 찾을 수 없으니 저장해두세요.</p></div><button type="button" className="text-button" onClick={copy}>{copied ? "복사됨" : "링크 저장"}</button></section>;
}
