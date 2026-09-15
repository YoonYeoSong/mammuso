import "server-only";
import { hashToken } from "@/lib/security";
import type { Answers, CaseStatus, DecisionResult, MammusoCase, PreliminaryResult, RelationshipType } from "./types";

type CreateInput = {
  publicCaseNumber: string; relationshipType: RelationshipType; complainantStatement: string;
  applicantTokenHash: string; applicantQuestions: string[]; neutralSummary: string; neutralIssues: string[]; safetyLevel: "none" | "urgent";
  policyVersion: string;
};

export interface CaseRepository {
  createCase(input: CreateInput): Promise<MammusoCase>;
  getByApplicantToken(token: string): Promise<MammusoCase | null>;
  getByRespondentToken(token: string): Promise<MammusoCase | null>;
  saveApplicantReview(token: string, answers: Answers, result: PreliminaryResult, respondentQuestions: string[]): Promise<MammusoCase>;
  markApplicantSafety(token: string, answers: Answers): Promise<MammusoCase>;
  issueRespondentInvite(applicantToken: string, respondentTokenHash: string): Promise<MammusoCase>;
  saveRespondentStatement(token: string, statement: string, answers: Answers, result: DecisionResult, policyVersion: string): Promise<MammusoCase>;
  markRespondentSafety(token: string, statement: string, answers: Answers): Promise<MammusoCase>;
  saveAppeal(applicantToken: string, appealText: string, result: DecisionResult): Promise<MammusoCase>;
  deleteByApplicantToken(token: string): Promise<void>;
  deleteExpiredCases(before: string): Promise<number>;
}

type DbCase = Record<string, unknown>;
const fieldMap = (row: DbCase): MammusoCase => ({
  id: String(row.id), publicCaseNumber: String(row.public_case_number), department: String(row.department),
  relationshipType: row.relationship_type as RelationshipType, status: row.status as CaseStatus,
  complainantStatement: String(row.complainant_statement), complainantAnswers: (row.complainant_answers ?? {}) as Answers,
  respondentStatement: row.respondent_statement as string | null, respondentAnswers: (row.respondent_answers ?? {}) as Answers,
  applicantQuestions: (row.applicant_questions ?? []) as string[], respondentQuestions: (row.respondent_questions ?? []) as string[], neutralSummary: String(row.neutral_summary ?? ""),
  neutralIssues: (row.neutral_issues ?? []) as string[], safetyLevel: row.safety_level as "none" | "urgent",
  preliminaryResult: row.preliminary_result as PreliminaryResult | null, finalResult: row.final_result as DecisionResult | null,
  appealText: row.appeal_text as string | null, appealResult: row.appeal_result as DecisionResult | null,
  applicantPolicyVersion: row.applicant_policy_version as string | null,
  applicantPolicyAgreedAt: row.applicant_policy_agreed_at as string | null,
  applicantAiProcessingAgreedAt: row.applicant_ai_processing_agreed_at as string | null,
  respondentPolicyVersion: row.respondent_policy_version as string | null,
  respondentPolicyAgreedAt: row.respondent_policy_agreed_at as string | null,
  respondentAiProcessingAgreedAt: row.respondent_ai_processing_agreed_at as string | null,
  createdAt: String(row.created_at), updatedAt: String(row.updated_at),
});

class SupabaseCaseRepository implements CaseRepository {
  private url: string; private key: string;
  constructor() {
    this.url = process.env.SUPABASE_URL ?? ""; this.key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!this.url || !this.key) throw new Error("DB_NOT_CONFIGURED");
  }
  private async request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${this.url}/rest/v1/cases${path}`, {
      ...init, headers: { apikey: this.key, "Content-Type": "application/json", Prefer: "return=representation", ...init.headers }, cache: "no-store",
    });
    if (!response.ok) throw new Error(`DATABASE_ERROR:${response.status}`);
    return response.status === 204 ? null : response.json() as Promise<DbCase[]>;
  }
  private async one(path: string, init?: RequestInit) { const rows = await this.request(path, init); return rows?.[0] ? fieldMap(rows[0]) : null; }
  createCase(input: CreateInput) { return this.one("", { method: "POST", body: JSON.stringify({ public_case_number: input.publicCaseNumber, relationship_type: input.relationshipType, status: input.safetyLevel === "urgent" ? "SAFETY_GUIDANCE" : "FACT_CHECKING", complainant_statement: input.complainantStatement, applicant_token_hash: input.applicantTokenHash, applicant_questions: input.applicantQuestions, neutral_summary: input.neutralSummary, neutral_issues: input.neutralIssues, safety_level: input.safetyLevel, applicant_policy_version: input.policyVersion, applicant_policy_agreed_at: new Date().toISOString(), applicant_ai_processing_agreed_at: new Date().toISOString() }) }).then((v) => v!); }
  getByApplicantToken(token: string) { return this.one(`?applicant_token_hash=eq.${hashToken(token)}&select=*`); }
  getByRespondentToken(token: string) { return this.one(`?respondent_token_hash=eq.${hashToken(token)}&select=*`); }
  private update(filter: string, body: Record<string, unknown>) { return this.one(`?${filter}&select=*`, { method: "PATCH", body: JSON.stringify(body) }); }
  saveApplicantReview(token: string, answers: Answers, result: PreliminaryResult, respondentQuestions: string[]) { return this.update(`applicant_token_hash=eq.${hashToken(token)}`, { complainant_answers: answers, preliminary_result: result, respondent_questions: respondentQuestions, status: "APPLICANT_COMPLETE" }).then((v) => v!); }
  markApplicantSafety(token: string, answers: Answers) { return this.update(`applicant_token_hash=eq.${hashToken(token)}`, { complainant_answers: answers, safety_level: "urgent", status: "SAFETY_GUIDANCE" }).then((v) => v!); }
  issueRespondentInvite(token: string, respondentTokenHash: string) { return this.update(`applicant_token_hash=eq.${hashToken(token)}`, { respondent_token_hash: respondentTokenHash, status: "AWAITING_RESPONDENT" }).then((v) => v!); }
  saveRespondentStatement(token: string, statement: string, answers: Answers, result: DecisionResult, policyVersion: string) { return this.update(`respondent_token_hash=eq.${hashToken(token)}`, { respondent_statement: statement, respondent_answers: answers, final_result: result, status: "COMPLETED", respondent_policy_version: policyVersion, respondent_policy_agreed_at: new Date().toISOString(), respondent_ai_processing_agreed_at: new Date().toISOString() }).then((v) => v!); }
  markRespondentSafety(token: string, statement: string, answers: Answers) { return this.update(`respondent_token_hash=eq.${hashToken(token)}`, { respondent_statement: statement, respondent_answers: answers, safety_level: "urgent", status: "SAFETY_GUIDANCE" }).then((v) => v!); }
  async saveAppeal(token: string, appealText: string, result: DecisionResult) {
    const current = await this.getByApplicantToken(token); if (!current) throw new Error("CASE_NOT_FOUND");
    if (current.appealText) throw new Error("APPEAL_ALREADY_FILED");
    return this.update(`applicant_token_hash=eq.${hashToken(token)}&appeal_text=is.null`, { appeal_text: appealText, appeal_result: result }).then((v) => { if (!v) throw new Error("APPEAL_ALREADY_FILED"); return v; });
  }
  async deleteByApplicantToken(token: string) {
    const response = await fetch(`${this.url}/rest/v1/cases?applicant_token_hash=eq.${hashToken(token)}`, { method: "DELETE", headers: { apikey: this.key, Prefer: "return=minimal" }, cache: "no-store" });
    if (!response.ok) throw new Error(`DATABASE_ERROR:${response.status}`);
  }
  async deleteExpiredCases(before: string) {
    const response = await fetch(`${this.url}/rest/v1/cases?updated_at=lt.${encodeURIComponent(before)}`, { method: "DELETE", headers: { apikey: this.key, Prefer: "return=representation" }, cache: "no-store" });
    if (!response.ok) throw new Error(`DATABASE_ERROR:${response.status}`);
    const rows = await response.json() as DbCase[];
    return rows.length;
  }
}

export function getCaseRepository(): CaseRepository { return new SupabaseCaseRepository(); }
