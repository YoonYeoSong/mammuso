import "server-only";
import { z } from "zod";
import type { Answers, DecisionResult, PreliminaryResult, RelationshipType } from "@/lib/cases/types";

const questionsSchema = z.object({ questions: z.array(z.string().min(4).max(160)).min(2).max(4) });
const issuesSchema = z.object({ issues: z.array(z.string().min(4).max(240)).min(1).max(5) });
const preliminarySchema = z.object({ summary: z.string(), knownFacts: z.array(z.string()), openQuestions: z.array(z.string()), opinion: z.string(), clerkComment: z.string() });
const decisionSchema = z.object({ overview: z.string(), agreedFacts: z.array(z.string()), complainantClaims: z.array(z.string()), respondentClaims: z.array(z.string()), disputedFacts: z.array(z.string()), unknownFacts: z.array(z.string()), complainantResponsibility: z.number().int().min(0).max(100), respondentResponsibility: z.number().int().min(0).max(100), reasoning: z.string(), mediationAdvice: z.string(), clerkComment: z.string(), changedReason: z.string().optional() }).transform((value) => ({ ...value, respondentResponsibility: 100 - value.complainantResponsibility }));

export interface AIProvider {
  generateFollowUpQuestions(input: { statement: string; relationshipType: RelationshipType; party: "applicant" | "respondent" }): Promise<string[]>;
  extractNeutralIssues(statement: string): Promise<string[]>;
  generatePreliminaryOpinion(input: { statement: string; answers: Answers }): Promise<PreliminaryResult>;
  generateJointDecision(input: { applicantStatement: string; applicantAnswers: Answers; respondentStatement: string; respondentAnswers: Answers }): Promise<DecisionResult>;
  generateAppealDecision(input: { applicantStatement: string; applicantAnswers: Answers; respondentStatement: string; respondentAnswers: Answers; previousResult: DecisionResult; appealText: string }): Promise<DecisionResult>;
}

class GroqAIProvider implements AIProvider {
  private key = process.env.GROQ_API_KEY;
  private model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  constructor() { if (!this.key) throw new Error("AI_NOT_CONFIGURED"); }
  private async ask<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.key}` }, body: JSON.stringify({ model: this.model, temperature: 0.25, response_format: { type: "json_object" }, messages: [{ role: "user", content: `${prompt}\n\nReturn only valid JSON. Do not use markdown.` }] }) });
        if (!response.ok) throw new Error(`AI_REQUEST_FAILED:${response.status}`);
        const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
        const text = payload.choices?.[0]?.message?.content;
        if (!text) throw new Error("AI_EMPTY_RESPONSE");
        return schema.parse(JSON.parse(text));
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
    throw new Error("AI_REQUEST_FAILED");
  }
  async generateFollowUpQuestions(input: { statement: string; relationshipType: RelationshipType; party: "applicant" | "respondent" }) {
    const role = input.party === "applicant" ? "신청인" : "상대방";
    const result = await this.ask(`${role}의 관계 유형은 ${input.relationshipType}입니다. 다음 진술을 읽고, 편들지 말고 시간·행동·전달 내용 중심의 사실확인 질문을 정확히 2~4개 만드세요. 없는 사실을 전제하지 마세요. 진술: ${input.statement}\nSchema: {"questions":["..."]}`, questionsSchema); return result.questions;
  }
  async extractNeutralIssues(statement: string) { const result = await this.ask(`아래 신청인 진술을 상대방에게 원문·감정표현·비난을 공개하지 않는 중립적 쟁점 1~5개로 요약하세요. 단정하지 말고 '신청인은 ...라고 진술합니다' 형식을 우선 사용하세요. 진술: ${statement}\nSchema: {"issues":["..."]}`, issuesSchema); return result.issues; }
  generatePreliminaryOpinion(input: { statement: string; answers: Answers }) { return this.ask(`신청인 1인의 진술만 기준으로 한 신중한 검토의견을 작성하세요. 확정 판정·책임비율을 제시하지 말고, 확인되지 않은 부분은 명시하세요. 공격적 표현은 중립화하세요. 진술: ${input.statement}\n추가답변: ${JSON.stringify(input.answers)}\nSchema: {"summary":"","knownFacts":[],"openQuestions":[],"opinion":"","clerkComment":""}`, preliminarySchema); }
  generateJointDecision(input: { applicantStatement: string; applicantAnswers: Answers; respondentStatement: string; respondentAnswers: Answers }) { return this.decision(`양측 관계분쟁 진술을 비교해 조정 의견을 작성하세요. 제공되지 않은 사실을 만들지 말고 불명확하면 판단불가로 적으세요. 이는 법률 판단이 아닙니다. 신청인 진술: ${input.applicantStatement}\n신청인 답변:${JSON.stringify(input.applicantAnswers)}\n상대방 진술:${input.respondentStatement}\n상대방 답변:${JSON.stringify(input.respondentAnswers)}`); }
  generateAppealDecision(input: { applicantStatement: string; applicantAnswers: Answers; respondentStatement: string; respondentAnswers: Answers; previousResult: DecisionResult; appealText: string }) { return this.decision(`아래 관계분쟁을 재심의하세요. 기존 결과, 양측 진술, 새 이의신청만 근거로 하며 새 사실을 만들지 마세요. changedReason에는 기존 결과에서 달라진 이유 또는 변경 없음 사유를 쓰세요. 신청인:${input.applicantStatement}\n신청인답변:${JSON.stringify(input.applicantAnswers)}\n상대방:${input.respondentStatement}\n상대방답변:${JSON.stringify(input.respondentAnswers)}\n기존:${JSON.stringify(input.previousResult)}\n이의신청:${input.appealText}`); }
  private decision(context: string) { return this.ask(`${context}\nSchema: {"overview":"","agreedFacts":[],"complainantClaims":[],"respondentClaims":[],"disputedFacts":[],"unknownFacts":[],"complainantResponsibility":0,"respondentResponsibility":100,"reasoning":"","mediationAdvice":"","clerkComment":"","changedReason":""}`, decisionSchema); }
}

export function getAIProvider(): AIProvider { return new GroqAIProvider(); }
