"use client";

import { useState } from "react";
import type { DecisionResult } from "@/lib/cases/types";
import { clerkInnerThought, judgeForCase, judgeOpening } from "@/lib/cases/judges";

export function CaseResult({ result, rehearing = false, caseNumber = "" }: { result: DecisionResult; rehearing?: boolean; caseNumber?: string }) {
  const [showLifeSolutions, setShowLifeSolutions] = useState(false);
  const complainantResponsibility = Math.min(80, Math.max(20, result.complainantResponsibility));
  const respondentResponsibility = 100 - complainantResponsibility;
  const judge = judgeForCase(caseNumber, rehearing);
  const judgeMessage = judgeOpening(judge, complainantResponsibility);
  return <section className="result-card">
    <p className="eyebrow">{rehearing ? "다른 재판장의 재심의" : "양쪽 진술 심리결과"}</p><h2>{rehearing ? "다시 정리한 조정 결과" : "담당 재판장의 조정 결과"}</h2>
    <section className="judge-assignment"><img src={judge.image} alt="" /><div><p className="eyebrow">{rehearing ? "재심의 담당" : "이번 사건의 담당"}</p><b>{judge.name}</b><span>{judge.title}</span></div></section>
    <section className={`judge-dialogue ${judge.id}`}><img src={judge.image} alt="" /><div><b>{judge.name}</b><p>{judgeMessage}</p></div></section>
    <p className="result-overview">{result.overview}</p>
    <section className="responsibility-card" aria-label="관계 갈등 책임지표">
      <div className="responsibility-head"><div><p className="eyebrow">관계 갈등 책임지표</p><h3>누가 갈등을 더 키웠나요?</h3></div><span>참고용 조정지표</span></div>
      <div className="responsibility-values"><div className="responsibility-value applicant"><span>신청인</span><b>{complainantResponsibility}<small>%</small></b></div><div className="responsibility-value respondent"><span>상대방</span><b>{respondentResponsibility}<small>%</small></b></div></div>
      <div className="ratio" aria-label={`신청인 ${complainantResponsibility}퍼센트, 상대방 ${respondentResponsibility}퍼센트`}><div className="ratio-applicant" style={{ width: `${complainantResponsibility}%` }} /><div className="ratio-respondent" style={{ width: `${respondentResponsibility}%` }} /></div>
      <p className="ratio-caption">수치가 높을수록 해당 사람이 이번 갈등을 키운 정도가 크다고 본다는 뜻입니다. 법적 과실이나 잘잘못의 확정 판정은 아닙니다.</p>
    </section>
    <ResultList title="양측 인정 사실" items={result.agreedFacts} /><ResultList title="신청인 주장" items={result.complainantClaims} /><ResultList title="상대방 주장" items={result.respondentClaims} /><ResultList title="주요 쟁점" items={result.disputedFacts} /><ResultList title="판단불가 사항" items={result.unknownFacts} />
    <section><h3>{judge.name}의 정리</h3><p>{result.reasoning}</p></section>
    <section className="basic-solution"><p className="eyebrow">기본 조정안</p><h3>우선 여기부터 해보세요</h3><p>{result.mediationAdvice}</p><button type="button" className="life-solution-button" onClick={() => setShowLifeSolutions((visible) => !visible)} aria-expanded={showLifeSolutions}>{showLifeSolutions ? "생활형 해결책 접기" : "생활형 해결책 더 보기"}</button>{showLifeSolutions && <div className="life-solutions"><b>오늘 바로 써먹는 세 가지</b><ol><li>각자 원하는 한 가지를 “나는 이번 주에 ___가 필요해”로 말해보세요.</li><li>감정이 높아지면 결론을 내지 말고, 20분 뒤 다시 이야기할 시간을 정하세요.</li><li>다음 일주일만 적용할 작은 약속 하나를 함께 정하고, 잘 안 되면 방법만 바꿔보세요.</li></ol></div>}</section>{result.changedReason && <section><h3>이번 재심의에서 달라진 점</h3><p>{result.changedReason}</p></section>}
    <div className="clerk-inner-thought"><img className="clerk-mini" src="/illustrations/hamji-clerk.png" alt="" /><div><p className="eyebrow">김햄찌 주무관의 속마음</p><p>{clerkInnerThought(complainantResponsibility)}</p></div></div>
    <small>위 재판장과 조정안은 양측 진술을 정리한 맘무소의 가상 관계심리 콘텐츠입니다. 법률적 과실비율이나 법적 판단이 아닙니다.</small>
  </section>;
}

function ResultList({ title, items }: { title: string; items: string[] }) { return <section><h3>{title}</h3>{items.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>확인되지 않음</p>}</section>; }
