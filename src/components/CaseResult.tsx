import type { DecisionResult } from "@/lib/cases/types";

export function CaseResult({ result, rehearing = false }: { result: DecisionResult; rehearing?: boolean }) {
  const complainantResponsibility = Math.min(99, Math.max(1, result.complainantResponsibility === 50 ? 49 : result.complainantResponsibility));
  const respondentResponsibility = 100 - complainantResponsibility;
  const moreResponsible = complainantResponsibility > respondentResponsibility ? "신청인" : "상대방";

  return <section className="result-card simple-result-card">
    <p className="eyebrow">{rehearing ? "이의신청 결과" : "최종 결론"}</p>
    <h2>{moreResponsible}의 잘못이 더 큽니다.</h2>
    <div className="responsibility-card" aria-label="책임 비중"><div className="responsibility-values"><div className="responsibility-value applicant"><span>신청인</span><b>{complainantResponsibility}<small>%</small></b></div><div className="responsibility-value respondent"><span>상대방</span><b>{respondentResponsibility}<small>%</small></b></div></div><div className="ratio" aria-label={`신청인 ${complainantResponsibility}퍼센트, 상대방 ${respondentResponsibility}퍼센트`}><div className="ratio-applicant" style={{ width: `${complainantResponsibility}%` }} /><div className="ratio-respondent" style={{ width: `${respondentResponsibility}%` }} /></div></div>
    <p className="result-overview">{result.overview}</p>
    <p className="result-reason">{result.reasoning}</p>
    <small>참고용 조정 의견이며 법적 판단은 아닙니다.</small>
  </section>;
}
