"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ReceptionStage = "idle" | "reviewing" | "handoff";

export function IntakeForm() {
  const router = useRouter();
  const [incidentDate, setIncidentDate] = useState("");
  const [statement, setStatement] = useState("");
  const [privacyPolicyAgreed, setPrivacyPolicyAgreed] = useState(false);
  const [aiProcessingAgreed, setAiProcessingAgreed] = useState(false);
  const [strongLanguageAgreed, setStrongLanguageAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<ReceptionStage>("idle");
  const calendarRef = useRef<HTMLInputElement>(null);

  function updateTypedDate(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    setIncidentDate([digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join("-"));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setLoading(true); setStage("reviewing");
    try {
      const response = await fetch("/api/cases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ incidentDate, statement, privacyPolicyAgreed, aiProcessingAgreed, strongLanguageAgreed }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setStage("handoff");
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
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
        <div className="incident-date-field" style={{ display: "flex", alignItems: "center", gap: 5 }}><input id="incident-date" type="text" value={incidentDate} onChange={(event) => updateTypedDate(event.target.value)} inputMode="numeric" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" placeholder="YYYY-MM-DD" style={{ flex: 1 }} required /><button type="button" aria-label="달력에서 날짜 선택" onClick={() => calendarRef.current?.showPicker()} style={{ display: "grid", width: 40, height: 40, flex: "none", placeItems: "center", border: "1px solid #d9cdb8", borderRadius: 11, background: "#fffefb", color: "#655c4e", cursor: "pointer", fontSize: 18 }}><span aria-hidden="true">▦</span></button><input ref={calendarRef} type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(incidentDate) ? incidentDate : ""} onChange={(event) => setIncidentDate(event.target.value)} tabIndex={-1} aria-hidden="true" style={{ position: "absolute", width: 1, minWidth: 1, height: 1, minHeight: 1, padding: 0, opacity: 0, pointerEvents: "none" }} /></div>
        <small>직접 YYYY-MM-DD로 쓰거나, 오른쪽 달력에서 고를 수 있습니다. 시간은 적지 않아도 됩니다.</small>
        <label htmlFor="statement">내용을 적어주세요</label>
        <p className="field-intro">누가 무엇을 했는지, 어떤 말이나 일이 남았는지만 적으면 됩니다.</p>
        <textarea id="statement" value={statement} onChange={(event) => setStatement(event.target.value)} minLength={20} maxLength={5000} placeholder="예: 약속한 날에 연락 없이 오지 않았고, 나중에도 이유를 제대로 설명하지 않았어요." required />
      </section>
      <div className="privacy-guard"><b>안전하게 적어주세요</b><p>실명, 연락처, 주소, 비밀번호, 제3자의 개인정보와 대화 원문 전체는 적지 마세요. 지금 안전이 위급하다면 이 서비스보다 긴급 도움기관을 먼저 이용해야 합니다.</p></div>
      <section className="consent-block"><label className="consent"><input type="checkbox" checked={privacyPolicyAgreed} onChange={(event) => setPrivacyPolicyAgreed(event.target.checked)} required /> <span><Link href="/privacy" target="_blank">개인정보처리방침</Link>을 읽었으며, 사건 기록의 수집·이용에 동의합니다.</span></label><label className="consent"><input type="checkbox" checked={aiProcessingAgreed} onChange={(event) => setAiProcessingAgreed(event.target.checked)} required /> <span>AI 조정 의견 생성에 필요한 최소 내용 전송에 동의합니다.</span></label><label className="consent spicy-consent"><input type="checkbox" checked={strongLanguageAgreed} onChange={(event) => setStrongLanguageAgreed(event.target.checked)} required /> <span>결과에 욕설·강한 표현이 포함될 수 있음을 확인하고 동의합니다.</span></label></section>
      {error && <p className="error">{error}</p>}
      <button className="button full" disabled={loading || stage !== "idle" || !privacyPolicyAgreed || !aiProcessingAgreed || !strongLanguageAgreed}>{loading ? "민원 서류를 전달하고 있습니다…" : "동의하고 민원 접수하기"}</button>
    </form>
    {stage !== "idle" && <ReceptionAnimation stage={stage} />}
  </>;
}

function ReceptionAnimation({ stage }: { stage: Exclude<ReceptionStage, "idle"> }) {
  const handedOff = stage === "handoff";
  return <div className={`reception-overlay ${handedOff ? "handoff" : ""}`} role="status" aria-live="polite">
    <section className="reception-scene">
      <p className="eyebrow">맘무소 민원 접수처</p>
      <div className="reception-desk"><div className="walking-ham" aria-hidden="true" /><div className="receipt-inbox" aria-hidden="true"><span>접수 서류</span></div></div>
      {handedOff && <span className="receipt-stamp">접수완료</span>}
      <h2>{handedOff ? "접수가 완료됐어요" : "민원 서류를 확인하고 있습니다"}</h2>
      <p>{handedOff ? "이제 상대방 의견을 받으면 강한 한 줄 결론을 정리할 거예요." : "김햄찌 주무관이 서류를 접수 기록함으로 옮기고 있어요…"}</p>
    </section>
  </div>;
}
