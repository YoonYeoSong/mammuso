"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const relationships = ["연인/썸", "친구", "가족", "직장", "기타"] as const;
type ReceptionStage = "idle" | "reviewing" | "handoff";

export function IntakeForm() {
  const router = useRouter();
  const [relationshipType, setRelationshipType] = useState<(typeof relationships)[number]>("친구");
  const [statement, setStatement] = useState("");
  const [privacyPolicyAgreed, setPrivacyPolicyAgreed] = useState(false);
  const [aiProcessingAgreed, setAiProcessingAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<ReceptionStage>("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setLoading(true); setStage("reviewing");
    try {
      const response = await fetch("/api/cases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ relationshipType, statement, privacyPolicyAgreed, aiProcessingAgreed }) });
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
      <label>관계 유형</label>
      <div className="chips">{relationships.map((type) => <button type="button" className={relationshipType === type ? "chip selected" : "chip"} onClick={() => setRelationshipType(type)} key={type}>{type}</button>)}</div>
      <label htmlFor="statement">어떤 일이 있었나요?</label>
      <textarea id="statement" value={statement} onChange={(event) => setStatement(event.target.value)} minLength={20} maxLength={5000} placeholder="사건의 흐름, 약속이나 연락이 오간 시점, 내가 들은 말 등을 편하게 적어주세요." required />
      <div className="privacy-guard"><b>입력 전 꼭 확인해주세요</b><p>실명, 연락처, 주소, 주민등록번호, 비밀번호, 제3자의 개인정보, 대화 원문 전체는 적지 마세요. 폭력·성폭력·스토킹·자해 등 즉시 위험한 상황은 이 서비스가 아닌 긴급 도움기관을 먼저 이용해야 합니다.</p></div>
      <label className="consent"><input type="checkbox" checked={privacyPolicyAgreed} onChange={(event) => setPrivacyPolicyAgreed(event.target.checked)} required /> <span><Link href="/privacy" target="_blank">개인정보처리방침</Link>을 읽었으며, 사건 기록의 수집·이용에 동의합니다.</span></label>
      <label className="consent"><input type="checkbox" checked={aiProcessingAgreed} onChange={(event) => setAiProcessingAgreed(event.target.checked)} required /> <span>조정 의견 생성에 필요한 최소 내용이 국외 AI 제공업체에 전송될 수 있음에 동의합니다.</span></label>
      {error && <p className="error">{error}</p>}
      <button className="button full" disabled={loading || !privacyPolicyAgreed || !aiProcessingAgreed}>{loading ? "민원 서류를 전달하고 있습니다…" : "동의하고 민원 접수하기"}</button>
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
      <h2>{handedOff ? "김햄찌 주무관이 서류를 전달하고 있어요" : "민원 서류를 확인하고 있습니다"}</h2>
      <p>{handedOff ? "기록함 앞까지 천천히 걸어가 접수 도장을 찍는 중이에요." : "김햄찌 주무관이 서류를 들고 접수 기록함으로 가고 있어요…"}</p>
    </section>
  </div>;
}
