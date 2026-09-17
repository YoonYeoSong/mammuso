"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { SPICY_MODE_CONSENT_KEY, type MammusoCase, statusLabel } from "@/lib/cases/types";
import { CaseResult } from "./CaseResult";

const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js";

type KakaoShare = {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: { sendDefault: (message: { objectType: "text"; text: string; link: { mobileWebUrl: string; webUrl: string }; buttonTitle: string }) => void };
};

declare global { interface Window { Kakao?: KakaoShare; } }

export function ApplicantPortal({ initialCase, token }: { initialCase: MammusoCase; token: string }) {
  const [item, setItem] = useState(initialCase);
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

  async function request(path: string, body: object, method: "POST" | "DELETE" = "POST") {
    setBusy(true); setError("");
    try {
      const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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

  const spicyMode = item.complainantAnswers[SPICY_MODE_CONSENT_KEY] === "동의" && item.respondentAnswers[SPICY_MODE_CONSENT_KEY] === "동의";

  return <div className="portal simple-portal">
    <section className="case-banner compact-case-banner"><div><p className="eyebrow">사건번호</p><h1>{item.publicCaseNumber}</h1></div><span className="status">{statusLabel[item.status]}</span></section>
    {error && <p className="error">{error}</p>}
    {!item.finalResult && <section className="paper invite simple-card"><p className="eyebrow">상대방 출석요청</p><h2>상대방의 입장을 받아볼까요?</h2><p>상대방은 신청인 원문이 아닌 중립 요약을 보고 자신의 이야기를 작성합니다.</p>{!inviteUrl ? <button className="button full" disabled={busy} onClick={async () => { const data = await request("/api/case/invite", { token }); if (data?.inviteUrl) setInviteUrl(data.inviteUrl); }}>{busy ? "요청 준비 중…" : "출석 요청 링크 만들기"}</button> : <InviteShare url={inviteUrl} onRevoke={async () => { const data = await request("/api/case/invite", { token }, "DELETE"); if (data?.case) setInviteUrl(""); }} />}</section>}
    {!item.finalResult && item.preliminaryResult && <section className="paper preliminary-result simple-card"><p className="eyebrow">신청인 진술 기준</p><h2>{item.preliminaryResult.summary}</h2><p>{item.preliminaryResult.opinion}</p><div className="result-waiting"><b>최종 결론 대기 중</b><p>아직 한쪽의 이야기만 확인했습니다. 상대방 의견이 제출되면 양쪽 진술을 비교해 결론을 냅니다.</p></div></section>}
    {!item.finalResult && !item.preliminaryResult && <section className="paper simple-card"><h2>진술을 확인하고 있어요</h2><p>잠시 후 페이지를 새로고침해 주세요.</p></section>}
    {item.finalResult && <><CaseResult result={item.finalResult} caseNumber={item.publicCaseNumber} spicyMode={spicyMode} respondentStatement={item.respondentStatement} />{item.appealResult ? <CaseResult result={item.appealResult} caseNumber={item.publicCaseNumber} rehearing spicyMode={spicyMode} respondentStatement={item.respondentStatement} /> : <section className="paper appeal-request simple-card"><p className="eyebrow">이의신청</p><h2>결론에 다른 부분이 있나요?</h2><textarea value={appealText} onChange={(event) => setAppealText(event.target.value)} minLength={10} placeholder="다시 봐야 할 사실만 적어주세요." /><button className="button full" disabled={busy || appealText.length < 10} onClick={() => request("/api/case/appeal", { token, appealText })}>{busy ? "다시 검토 중…" : "이의신청하기"}</button></section>}</>}
    <button className="text-button delete-case-button" type="button" disabled={busy} onClick={deleteCase}>이 사건 삭제</button>
  </div>;
}

function InviteShare({ url, onRevoke }: { url: string; onRevoke: () => Promise<void> }) {
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  const [confirmed, setConfirmed] = useState(false);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  function initializeKakao() {
    try {
      if (!kakaoKey || !window.Kakao) return;
      if (!window.Kakao.isInitialized()) window.Kakao.init(kakaoKey);
      setReady(window.Kakao.isInitialized());
    } catch { setError("카카오톡 공유를 준비하지 못했습니다. 잠시 후 다시 시도해주세요."); }
  }

  function share() {
    if (!confirmed) return;
    if (!window.Kakao?.isInitialized()) { setError("카카오톡 공유를 아직 준비하고 있습니다. 잠시 후 다시 시도해주세요."); return; }
    window.Kakao.Share.sendDefault({ objectType: "text", text: "맘무소에서 의견을 요청합니다.\n관련된 일에 대한 본인의 기억과 입장을 남겨주세요.\n맘무소는 실제 행정·법률기관이 아니며, 참여는 의무가 아닙니다.", link: { mobileWebUrl: url, webUrl: url }, buttonTitle: "의견 작성하기" });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch { setError("링크를 복사하지 못했습니다. 주소를 길게 눌러 직접 복사해주세요."); }
  }

  return <div className="invite-share">{kakaoKey && <Script id="kakao-js-sdk" src={KAKAO_SDK_SRC} integrity="sha384-oroumrnFVE0xtgqyDZJARgERibXg2C28380uaUZz2kHDS5CR7tu20eGiOU6GkTpy" strategy="afterInteractive" crossOrigin="anonymous" onReady={initializeKakao} onError={() => setError("카카오톡 공유 도구를 불러오지 못했습니다.")} />}<div style={{ marginTop: 16, border: "1px solid #e3d8c5", borderRadius: 12, padding: 12, background: "#fffdf8" }}><b style={{ display: "block", fontSize: 13 }}>출석 요청 링크</b><code style={{ display: "block", marginTop: 7, overflowWrap: "anywhere", color: "#655c4e", fontSize: 12 }}>{url}</code><button type="button" className="text-button" onClick={copyLink} style={{ marginTop: 10 }}>{copied ? "링크 복사됨" : "링크 복사하기"}</button></div><label className="share-confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> <span>이 요청을 해당 상대방에게만 공유하며, 받은 사람은 중립 요약과 의견 작성 화면을 볼 수 있음을 확인했습니다.</span></label><button type="button" className="button full kakao-share" disabled={!confirmed || !ready} onClick={share}><span aria-hidden="true">K</span> 카카오톡으로 의견 요청하기</button>{!kakaoKey && <small>카카오톡 공유 설정을 준비 중입니다. 운영자가 카카오 JavaScript 키와 도메인을 등록하면 사용할 수 있어요.</small>}{kakaoKey && !ready && !error && <small>카카오톡 공유를 준비하고 있어요.</small>}{error && <p className="error">{error}</p>}<small>카카오 메시지에는 사연·사건번호·신청인 정보가 포함되지 않습니다. 요청은 일정 기간 후 만료되며, 철회하면 즉시 열 수 없게 됩니다.</small><button type="button" className="text-button invite-revoke" onClick={onRevoke}>요청 철회하기</button></div>;
}
