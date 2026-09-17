export const CASE_STATUSES = [
  "RECEIVED", "FACT_CHECKING", "APPLICANT_COMPLETE", "AWAITING_RESPONDENT",
  "BOTH_STATEMENTS_RECEIVED", "COMPLETED", "SAFETY_GUIDANCE"
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];
export type RelationshipType = "연인/썸" | "친구" | "가족" | "직장" | "기타";
export type Answers = Record<string, string>;
export const STRONG_LANGUAGE_CONSENT_KEY = "강한 표현 동의";

export type PreliminaryResult = {
  summary: string;
  knownFacts: string[];
  openQuestions: string[];
  opinion: string;
  clerkComment: string;
};
export type DecisionResult = {
  overview: string;
  agreedFacts: string[];
  complainantClaims: string[];
  respondentClaims: string[];
  disputedFacts: string[];
  unknownFacts: string[];
  complainantResponsibility: number;
  respondentResponsibility: number;
  reasoning: string;
  mediationAdvice: string;
  clerkComment: string;
  changedReason?: string;
};

export type MammusoCase = {
  id: string;
  publicCaseNumber: string;
  department: string;
  relationshipType: RelationshipType;
  incidentDate: string | null;
  status: CaseStatus;
  complainantStatement: string;
  complainantAnswers: Answers;
  respondentStatement: string | null;
  respondentAnswers: Answers;
  applicantQuestions: string[];
  respondentQuestions: string[];
  neutralSummary: string;
  neutralIssues: string[];
  safetyLevel: "none" | "urgent";
  preliminaryResult: PreliminaryResult | null;
  finalResult: DecisionResult | null;
  appealText: string | null;
  appealResult: DecisionResult | null;
  applicantPolicyVersion: string | null;
  applicantPolicyAgreedAt: string | null;
  applicantAiProcessingAgreedAt: string | null;
  respondentPolicyVersion: string | null;
  respondentPolicyAgreedAt: string | null;
  respondentAiProcessingAgreedAt: string | null;
  respondentInviteExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const statusLabel: Record<CaseStatus, string> = {
  RECEIVED: "접수완료",
  FACT_CHECKING: "사실관계 확인 중",
  APPLICANT_COMPLETE: "신청인 진술 검토 완료",
  AWAITING_RESPONDENT: "상대방 의견 대기",
  BOTH_STATEMENTS_RECEIVED: "합동심의 중",
  COMPLETED: "처리완료",
  SAFETY_GUIDANCE: "안전 안내 필요",
};
