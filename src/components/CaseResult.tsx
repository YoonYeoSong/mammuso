"use client";

import { useId, useState } from "react";
import type { DecisionResult } from "@/lib/cases/types";

export function CaseResult({ result, rehearing = false, spicyMode = false }: { result: DecisionResult; rehearing?: boolean; caseNumber?: string; spicyMode?: boolean }) {
  const [showDetails, setShowDetails] = useState(false);
  const detailsId = useId();
  const complainantResponsibility = Math.min(80, Math.max(20, result.complainantResponsibility));
  const respondentResponsibility = 100 - complainantResponsibility;

  return <section className="result-card">
    <p className="eyebrow">{spicyMode ? "매운맛 결과" : rehearing ? "재심의 결과" : "조정 결과"}</p>
    <h2>{rehearing ? "다시 본 결론" : "이번 일의 결론"}</h2>
    <p className="result-overview">{result.overview}</p>
    <section className="responsibility-card" aria-label="갈등 영향 비중">
      <h3>갈등 영향</h3>
      <div className="responsibility-values"><div className="responsibility-value applicant"><span>신청인</span><b>{complainantResponsibility}<small>%</small></b></div><div className="responsibility-value respondent"><span>상대방</span><b>{respondentResponsibility}<small>%</small></b></div></div>
      <div className="ratio" aria-label={`신청인 ${complainantResponsibility}퍼센트, 상대방 ${respondentResponsibility}퍼센트`}><div className="ratio-applicant" style={{ width: `${complainantResponsibility}%` }} /><div className="ratio-respondent" style={{ width: `${respondentResponsibility}%` }} /></div>
    </section>
    <section className="basic-solution"><p className="eyebrow">지금 해볼 것</p><p>{result.mediationAdvice}</p></section>
    <section className="result-details">
      <button type="button" className="result-details-button" onClick={() => setShowDetails((visible) => !visible)} aria-expanded={showDetails} aria-controls={detailsId}>
        <span>{showDetails ? "판단 근거 접기" : "판단 근거 보기"}</span><small>{showDetails ? "−" : "+"}</small>
      </button>
      {showDetails && <div id={detailsId} className="result-details-content"><ResultList title="확인된 내용" items={result.agreedFacts} /><ResultList title="서로 다른 내용" items={result.disputedFacts} /><section><h3>판단 이유</h3><p>{result.reasoning}</p></section>{result.changedReason && <section><h3>달라진 점</h3><p>{result.changedReason}</p></section>}</div>}
    </section>
    <small>참고용 조정 의견이며 법적 판단은 아닙니다.</small>
  </section>;
}

function ResultList({ title, items }: { title: string; items: string[] }) { return items.length ? <section><h3>{title}</h3><ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul></section> : null; }
