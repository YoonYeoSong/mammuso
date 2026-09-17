"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { judgeForCase, type Judge } from "@/lib/cases/judges";

type ReceptionStage = "idle" | "reviewing" | "handoff" | "assigned";

export function IntakeForm() {
  const router = useRouter();
  const [incidentDate, setIncidentDate] = useState("");
  const [statement, setStatement] = useState("");
  const [privacyPolicyAgreed, setPrivacyPolicyAgreed] = useState(false);
  const [aiProcessingAgreed, setAiProcessingAgreed] = useState(false);
  const [spicyModeAgreed, setSpicyModeAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<ReceptionStage>("idle");
  const [assignedJudge, setAssignedJudge] = useState<Judge | null>(null);
  function previewReceptionAnimation() {
    if (stage !== "idle") return;
    setAssignedJudge(judgeForCase("ANIMATION-PREVIEW", false, spicyModeAgreed));
    setStage("reviewing");
    window.setTimeout(() => setStage("handoff"), 550);
    window.setTimeout(() => setStage("assigned"), 2_350);
    window.setTimeout(() => { setStage("idle"); setAssignedJudge(null); }, 4_450);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setLoading(true); setStage("reviewing");
    try {
      const response = await fetch("/api/cases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ incidentDate, statement, privacyPolicyAgreed, aiProcessingAgreed, spicyModeAgreed }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setAssignedJudge(judgeForCase(data.case.publicCaseNumber, false, spicyModeAgreed));
      setStage("handoff");
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
      setStage("assigned");
      await new Promise((resolve) => window.setTimeout(resolve, 1850));
      router.push(`/case/${data.applicantToken}`);
    } catch (error) {
      setStage("idle");
      setError(error instanceof Error ? error.message : "접수에 실패했습니다.");
    } finally { setLoading(false); }
  }

  return <>
    <form className="paper form" onSubmit={submit}>
      <div className="form-progress"><span>1</span><div><b>무슨 일이 있었나요?</b><p>날짜와 기억나는 내용을 편하게 적어주세요.</p></div></div>
      <section className="form-section intake-basics">
        <label htmlFor="incident-date">언제 있었던 일인가요?</label>
        <div className="incident-date-field"><input id="incident-date" type="date" value={incidentDate} onChange={(event) => setIncidentDate(event.target.value)} required /></div>
        <small>시간은 적지 않아도 됩니다.</small>
        <label htmlFor="statement">내용을 적어주세요</label>
        <p className="field-intro">누가 무엇을 했는지, 어떤 말이나 일이 남았는지만 적으면 됩니다.</p>
        <textarea id="statement" value={statement} onChange={(event) => setStatement(event.target.value)} minLength={20} maxLength={5000} placeholder="예: 약속한 날에 연락 없이 오지 않았고, 나중에도 이유를 제대로 설명하지 않았어요." required />
      </section>
      <div className="privacy-guard"><b>안전하게 적어주세요</b><p>실명, 연락처, 주소, 비밀번호, 제3자의 개인정보와 대화 원문 전체는 적지 마세요. 지금 안전이 위급하다면 이 서비스보다 긴급 도움기관을 먼저 이용해야 합니다.</p></div>
      <section className="consent-block"><label className="consent"><input type="checkbox" checked={privacyPolicyAgreed} onChange={(event) => setPrivacyPolicyAgreed(event.target.checked)} required /> <span><Link href="/privacy" target="_blank">개인정보처리방침</Link>을 읽었으며, 사건 기록의 수집·이용에 동의합니다.</span></label><label className="consent"><input type="checkbox" checked={aiProcessingAgreed} onChange={(event) => setAiProcessingAgreed(event.target.checked)} required /> <span>AI 조정 의견 생성에 필요한 최소 내용 전송에 동의합니다.</span></label><label className="consent spicy-consent"><input type="checkbox" checked={spicyModeAgreed} onChange={(event) => setSpicyModeAgreed(event.target.checked)} /> <span>매운맛 결과의 강한 표현에 동의합니다. 상대방도 동의해야 적용됩니다.</span></label></section>
      {error && <p className="error">{error}</p>}
      <button className="button full" disabled={loading || stage !== "idle" || !privacyPolicyAgreed || !aiProcessingAgreed}>{loading ? "민원 서류를 전달하고 있습니다…" : "동의하고 민원 접수하기"}</button>
    </form>
    {stage !== "idle" && <ReceptionAnimation stage={stage} judge={assignedJudge} />}
  </>;
}

function ReceptionAnimation({ stage, judge }: { stage: Exclude<ReceptionStage, "idle">; judge: Judge | null }) {
  const handedOff = stage === "handoff" || stage === "assigned";
  const assigned = stage === "assigned" && judge;
  return <div className={`reception-overlay ${handedOff ? "handoff" : ""}`} role="status" aria-live="polite">
    <section className="reception-scene">
      <p className="eyebrow">맘무소 민원 접수처</p>
      <div className="reception-desk"><div className="walking-ham" aria-hidden="true" /><div className="receipt-inbox" aria-hidden="true"><span>접수 서류</span></div></div>
      {handedOff && <span className="receipt-stamp">접수완료</span>}
      {assigned && <div className={`judge-reveal ${judge.id}`}><img src={judge.image} alt="" /><div><span>사건 배정 완료</span><strong>{judge.name}</strong><p>{judge.title}</p></div></div>}
      <h2>{assigned ? `${judge.name}에게 사건이 배정됐어요` : handedOff ? "김햄찌 주무관이 서류를 전달하고 있어요" : "민원 서류를 확인하고 있습니다"}</h2>
      <p>{assigned ? judge.id === "yokjaengi" ? "매운맛 동의가 확인되면, 이 판사가 사실관계를 읽고 세게 정리합니다." : "이제 양쪽 이야기를 읽고 조정 결과를 정리할 거예요." : handedOff ? "기록함 앞까지 천천히 걸어가 접수 도장을 찍는 중이에요." : "김햄찌 주무관이 서류를 들고 접수 기록함으로 가고 있어요…"}</p>
    </section>
  </div>;
}
