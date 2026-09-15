import type { DecisionResult } from "@/lib/cases/types";

export function CaseResult({ result, rehearing = false }: { result: DecisionResult; rehearing?: boolean }) {
  const clerkComment = result.clerkComment.trim() || "다음 대화에서는 누가 더 억울한지부터 따지기보다, 각자 바라는 한 가지를 짧게 말하고 상대의 말을 끝까지 들어보세요.";
  const complainantResponsibility = Math.min(80, Math.max(20, result.complainantResponsibility));
  const respondentResponsibility = 100 - complainantResponsibility;
  return <section className="result-card">
    <p className="eyebrow">{rehearing ? "재심 민원 처리결과" : "민원 처리결과"}</p><h2>{rehearing ? "재심 조정결과" : "쌍방 진술 종합 조정결과"}</h2><p>{result.overview}</p>
    <section className="responsibility-card" aria-label="관계 갈등 책임지표">
      <div className="responsibility-head"><div><p className="eyebrow">관계 갈등 책임지표</p><h3>누가 갈등을 더 키웠나요?</h3></div><span>참고용 조정지표</span></div>
      <div className="responsibility-values"><div className="responsibility-value applicant"><span>신청인</span><b>{complainantResponsibility}<small>%</small></b></div><div className="responsibility-value respondent"><span>상대방</span><b>{respondentResponsibility}<small>%</small></b></div></div>
      <div className="ratio" aria-label={`신청인 ${complainantResponsibility}퍼센트, 상대방 ${respondentResponsibility}퍼센트`}><div className="ratio-applicant" style={{ width: `${complainantResponsibility}%` }} /><div className="ratio-respondent" style={{ width: `${respondentResponsibility}%` }} /></div>
      <p className="ratio-caption">수치가 높을수록 해당 사람이 이번 갈등을 키운 정도가 크다고 본다는 뜻입니다. 법적 과실이나 잘잘못의 확정 판정은 아닙니다.</p>
    </section>
    <ResultList title="양측 인정 사실" items={result.agreedFacts} /><ResultList title="신청인 주장" items={result.complainantClaims} /><ResultList title="상대방 주장" items={result.respondentClaims} /><ResultList title="주요 쟁점" items={result.disputedFacts} /><ResultList title="판단불가 사항" items={result.unknownFacts} />
    <section><h3>맘무소 조정의견</h3><p>{result.reasoning}</p><p className="advice">{result.mediationAdvice}</p></section>{result.changedReason && <section><h3>변경 이유</h3><p>{result.changedReason}</p></section>}
    <div className="clerk-note result-clerk-note"><img className="clerk-mini" src="/illustrations/hamji-clerk.png" alt="" /><div><b>김햄찌 주무관 의견</b><p>{clerkComment}</p></div></div>
    <small>본 수치는 양측이 제출한 진술을 바탕으로 생성한 맘무소 내부 참고용 관계분쟁 조정지표이며 법률적 과실비율이나 법적 판단이 아닙니다.</small>
  </section>;
}

function ResultList({ title, items }: { title: string; items: string[] }) { return <section><h3>{title}</h3>{items.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>확인되지 않음</p>}</section>; }
