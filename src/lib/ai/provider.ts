import "server-only";
import { z } from "zod";
import type { Answers, DecisionResult, PreliminaryResult, RelationshipType } from "@/lib/cases/types";

const questionsSchema = z.object({ questions: z.array(z.string().min(4).max(160)).min(2).max(4) });
const respondentNoticeSchema = z.object({ summary: z.string().min(10).max(300), issues: z.array(z.string().min(4).max(240)).min(1).max(4) });
const preliminarySchema = z.object({ summary: z.string(), knownFacts: z.array(z.string()), openQuestions: z.array(z.string()), opinion: z.string(), clerkComment: z.string() });
const decisionSchema = z.object({ overview: z.string(), agreedFacts: z.array(z.string()), complainantClaims: z.array(z.string()), respondentClaims: z.array(z.string()), disputedFacts: z.array(z.string()), unknownFacts: z.array(z.string()), complainantResponsibility: z.number().int().min(0).max(100), respondentResponsibility: z.number().int().min(0).max(100), reasoning: z.string(), mediationAdvice: z.string(), clerkComment: z.string(), changedReason: z.string().optional() }).transform((value) => ({ ...value, respondentResponsibility: 100 - value.complainantResponsibility }));

export interface AIProvider {
  generateFollowUpQuestions(input: { statement: string; relationshipType: RelationshipType; party: "applicant" | "respondent" }): Promise<string[]>;
  generateRespondentNotice(statement: string): Promise<{ summary: string; issues: string[] }>;
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
        const languageCorrection = attempt > 0 ? "\n이전 응답에 영어가 포함되어 거절되었습니다. JSON 키를 제외한 모든 값은 반드시 자연스러운 한국어 완성 문장으로 다시 작성하세요." : "";
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.key}` }, body: JSON.stringify({ model: this.model, temperature: 0.15, response_format: { type: "json_object" }, messages: [{ role: "system", content: "당신은 맘무소 관계분쟁조정과의 한국어 전담 문서 작성자입니다. 반드시 한국어로만 답하세요. JSON의 키 이름은 요청한 스키마를 따르되, JSON 값으로 들어가는 모든 문장·질문·목록 항목은 자연스러운 한국어로만 작성해야 합니다. Applicant, respondent, overview 같은 영어 단어와 영어 문장을 절대로 값에 쓰지 마세요. 제공되지 않은 사실은 만들지 마세요." }, { role: "user", content: `${prompt}${languageCorrection}\n\n유효한 JSON만 반환하세요. 마크다운을 사용하지 마세요.` }] }) });
        if (!response.ok) throw new Error(`AI_REQUEST_FAILED:${response.status}`);
        const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
        const text = payload.choices?.[0]?.message?.content;
        if (!text) throw new Error("AI_EMPTY_RESPONSE");
        const parsed = schema.parse(JSON.parse(text));
        assertKoreanOutput(parsed);
        return parsed;
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
    throw new Error("AI_REQUEST_FAILED");
  }
  async generateFollowUpQuestions(input: { statement: string; relationshipType: RelationshipType; party: "applicant" | "respondent" }) {
    const role = input.party === "applicant" ? "신청인" : "상대방";
    const respondentRule = input.party === "respondent" ? "상대방에게 보내는 질문입니다. 신청인의 표현이나 주장을 사실로 전제하지 마세요. '왜 말을 안 들었나요', '왜 그렇게 했나요'처럼 잘못을 단정하는 질문은 금지입니다. '이 상황을 어떻게 기억하시나요?', '당시 전달한 내용이나 사정이 있었나요?'처럼 상대방이 자유롭게 설명할 수 있는 중립 질문으로 작성하세요." : "";
    const result = await this.ask(`${role}의 관계 유형은 ${input.relationshipType}입니다. 다음 진술을 읽고, 편들지 말고 시간·행동·전달 내용 중심의 사실확인 질문을 정확히 2~4개 만드세요. 없는 사실을 전제하지 마세요. ${respondentRule} 진술: ${input.statement}\nSchema: {"questions":["..."]}`, questionsSchema); return result.questions;
  }
  async generateRespondentNotice(statement: string) { return this.ask(`아래 신청인 진술을 바탕으로 출석 링크를 받은 상대방에게 보여줄 중립 안내문을 만드세요. 원문, 욕설, 조롱, 인신공격은 절대 인용하지 마세요. summary에는 '이번 출석요구는 신청인이 ...와 관련해 의견 차이가 있었다고 접수한 건입니다.'처럼 어떤 갈등으로 접수됐는지만 1~2문장으로 설명하세요. issues에는 양측이 각자 설명할 수 있는 중립 쟁점만 1~4개 적으세요. 상대방이 잘못했다는 전제나 '왜 말을 안 들었나요' 같은 유도 질문을 만들지 마세요. 진술: ${statement}\nSchema: {"summary":"","issues":[""]}`, respondentNoticeSchema); }
  generatePreliminaryOpinion(input: { statement: string; answers: Answers }) { return this.ask(`신청인 1인의 진술만 기준으로 한 신중한 검토의견을 작성하세요. 확정 판정·책임비율을 제시하지 말고, 확인되지 않은 부분은 명시하세요. 공격적 표현은 중립화하세요. 법률적 위법성·범죄 여부를 단정하지 마세요. 진술: ${input.statement}\n추가답변: ${JSON.stringify(input.answers)}\nSchema: {"summary":"","knownFacts":[],"openQuestions":[],"opinion":"","clerkComment":""}`, preliminarySchema); }
  generateJointDecision(input: { applicantStatement: string; applicantAnswers: Answers; respondentStatement: string; respondentAnswers: Answers }) { return this.decision(`양측 관계분쟁 진술을 비교해 조정 의견을 작성하세요. 제공되지 않은 사실을 만들지 말고 불명확하면 판단불가로 적으세요. 이는 법률 판단이 아닙니다. 신청인 진술: ${input.applicantStatement}\n신청인 답변:${JSON.stringify(input.applicantAnswers)}\n상대방 진술:${input.respondentStatement}\n상대방 답변:${JSON.stringify(input.respondentAnswers)}`); }
  generateAppealDecision(input: { applicantStatement: string; applicantAnswers: Answers; respondentStatement: string; respondentAnswers: Answers; previousResult: DecisionResult; appealText: string }) { return this.decision(`아래 관계분쟁을 재심의하세요. 기존 결과, 양측 진술, 새 이의신청만 근거로 하며 새 사실을 만들지 마세요. changedReason에는 기존 결과에서 달라진 이유 또는 변경 없음 사유를 쓰세요. 신청인:${input.applicantStatement}\n신청인답변:${JSON.stringify(input.applicantAnswers)}\n상대방:${input.respondentStatement}\n상대방답변:${JSON.stringify(input.respondentAnswers)}\n기존:${JSON.stringify(input.previousResult)}\n이의신청:${input.appealText}`); }
  private decision(context: string) { return this.ask(`${context}\nSchema: {"overview":"","agreedFacts":[],"complainantClaims":[],"respondentClaims":[],"disputedFacts":[],"unknownFacts":[],"complainantResponsibility":0,"respondentResponsibility":100,"reasoning":"","mediationAdvice":"","clerkComment":"","changedReason":""}`, decisionSchema); }
}

function assertKoreanOutput(value: unknown): void {
  const textValues: string[] = [];
  const collect = (item: unknown) => {
    if (typeof item === "string") textValues.push(item);
    else if (Array.isArray(item)) item.forEach(collect);
    else if (item && typeof item === "object") Object.values(item).forEach(collect);
  };
  collect(value);
  const containsLatinWord = /\b[a-zA-Z]{4,}\b/;
  if (textValues.some((text) => text.trim() && (!/[가-힣]/.test(text) || containsLatinWord.test(text)))) throw new Error("AI_LANGUAGE_NOT_KOREAN");
}

export function getAIProvider(): AIProvider { return new GroqAIProvider(); }
