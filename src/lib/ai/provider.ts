import "server-only";
import { z } from "zod";
import type { Answers, DecisionResult, PreliminaryResult } from "@/lib/cases/types";

const respondentNoticeSchema = z.object({ summary: z.string().min(10).max(140), issues: z.array(z.string().min(4).max(100)).min(1).max(2) });
const preliminarySchema = z.object({ summary: z.string().min(10).max(140), knownFacts: z.array(z.string().min(2).max(110)).max(2), openQuestions: z.array(z.string().min(2).max(110)).max(2), opinion: z.string().min(20).max(180), clerkComment: z.string().min(12).max(100) });
const decisionListSchema = z.array(z.string().min(1).max(160)).max(6).transform((items) => items.slice(0, 2));
const decisionSchema = z.object({ overview: z.string().min(10).max(160), agreedFacts: decisionListSchema, complainantClaims: decisionListSchema, respondentClaims: decisionListSchema, disputedFacts: decisionListSchema, unknownFacts: decisionListSchema, complainantResponsibility: z.number().int().min(0).max(100), respondentResponsibility: z.number().int().min(0).max(100), reasoning: z.string().min(20).max(180), mediationAdvice: z.string().min(20).max(160), clerkComment: z.string().max(100), changedReason: z.string().max(160).optional() }).transform((value) => {
  const rawResponsibility = Math.min(99, Math.max(1, value.complainantResponsibility));
  const complainantResponsibility = rawResponsibility === 50 ? 49 : rawResponsibility;
  return { ...value, complainantResponsibility, respondentResponsibility: 100 - complainantResponsibility };
});

export interface AIProvider {
  generateRespondentNotice(input: { statement: string; incidentDate: string }): Promise<{ summary: string; issues: string[] }>;
  generatePreliminaryOpinion(input: { statement: string; incidentDate: string; answers: Answers }): Promise<PreliminaryResult>;
  generateJointDecision(input: { applicantStatement: string; incidentDate: string | null; applicantAnswers: Answers; respondentStatement: string; respondentAnswers: Answers; spicyMode: boolean }): Promise<DecisionResult>;
  generateAppealDecision(input: { applicantStatement: string; incidentDate: string | null; applicantAnswers: Answers; respondentStatement: string; respondentAnswers: Answers; previousResult: DecisionResult; appealText: string; spicyMode: boolean }): Promise<DecisionResult>;
}

class GroqAIProvider implements AIProvider {
  private key = process.env.GROQ_API_KEY;
  private model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  constructor() { if (!this.key) throw new Error("AI_NOT_CONFIGURED"); }
  private async ask<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const languageCorrection = attempt > 0 ? "\n이전 응답에 영어가 포함되어 거절되었습니다. JSON 키를 제외한 모든 값은 반드시 자연스러운 한국어 완성 문장으로 다시 작성하세요." : "";
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.key}` }, body: JSON.stringify({ model: this.model, temperature: 0.62, response_format: { type: "json_object" }, messages: [{ role: "system", content: "당신은 맘무소 관계분쟁조정과의 한국어 전담 판결문 작성자입니다. 반드시 한국어로만 답하세요. JSON의 키 이름은 요청한 스키마를 따르되, JSON 값으로 들어가는 모든 문장·질문·목록 항목은 자연스러운 한국어로만 작성해야 합니다. 제공되지 않은 사실은 만들지 마세요. 흔한 관계 조언, 같은 문장 반복, '서로 대화하세요', '상황을 정리하세요' 같은 뻔한 문구는 금지입니다. 주어진 진술에 실제로 나온 행동·말·순서 중 최소 두 가지를 근거로 문장을 다르게 작성하세요." }, { role: "user", content: `${prompt}${languageCorrection}\n\n유효한 JSON만 반환하세요. 마크다운을 사용하지 마세요.` }] }) });
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
  async generateRespondentNotice(input: { statement: string; incidentDate: string }) { return this.ask(`아래 신청인 진술을 바탕으로 상대방에게 보여줄 중립 요약을 만드세요. 원문, 욕설, 조롱, 인신공격은 인용하지 마세요. summary에는 ${input.incidentDate} 전후에 접수된 단 하나의 상황만 1문장으로 설명하세요. issues에는 각자가 설명할 수 있는 쟁점만 최대 2개 적으세요. 상대방이 잘못했다는 전제나 유도 질문은 금지입니다. 진술: ${input.statement}\nSchema: {"summary":"","issues":[""]}`, respondentNoticeSchema); }
  generatePreliminaryOpinion(input: { statement: string; incidentDate: string; answers: Answers }) { return this.ask(`신청인 1인의 진술만 기준으로 ${input.incidentDate}에 관한 임시 판단을 작성하세요. summary는 진술에 나온 구체적 사건을 1문장으로, knownFacts와 openQuestions는 각각 최대 2개로, opinion은 신청인 진술만으로는 확정할 수 없는 이유를 이 사건의 구체적 쟁점에 맞춰 1~2문장으로 작성하세요. 확정 판정·책임비율·법률 판단은 제시하지 마세요. 뻔한 조언은 쓰지 마세요. 진술: ${input.statement}\n추가답변: ${JSON.stringify(input.answers)}\nSchema: {"summary":"","knownFacts":[],"openQuestions":[],"opinion":"","clerkComment":""}`, preliminarySchema); }
  async generateJointDecision(input: { applicantStatement: string; incidentDate: string | null; applicantAnswers: Answers; respondentStatement: string; respondentAnswers: Answers; spicyMode: boolean }) { const result = await this.decision(`양측 관계분쟁 진술을 비교해 결론을 작성하세요. 사건 날짜: ${input.incidentDate ?? "미상"}\n신청인 진술: ${input.applicantStatement}\n신청인 답변:${JSON.stringify(input.applicantAnswers)}\n상대방 진술:${input.respondentStatement}\n상대방 답변:${JSON.stringify(input.respondentAnswers)}`, input.spicyMode); return input.spicyMode ? applySpicyTone(result) : result; }
  async generateAppealDecision(input: { applicantStatement: string; incidentDate: string | null; applicantAnswers: Answers; respondentStatement: string; respondentAnswers: Answers; previousResult: DecisionResult; appealText: string; spicyMode: boolean }) { const result = await this.decision(`아래 관계분쟁을 재심의하세요. 사건 날짜: ${input.incidentDate ?? "미상"}. 기존 결과, 양측 진술, 새 이의신청만 근거로 하며 새 사실을 만들지 마세요. changedReason에는 기존 결과에서 달라진 이유 또는 변경 없음 사유를 쓰세요. 신청인:${input.applicantStatement}\n신청인답변:${JSON.stringify(input.applicantAnswers)}\n상대방:${input.respondentStatement}\n상대방답변:${JSON.stringify(input.respondentAnswers)}\n기존:${JSON.stringify(input.previousResult)}\n이의신청:${input.appealText}`, input.spicyMode); return input.spicyMode ? applySpicyTone(result) : result; }
  private decision(context: string, spicyMode = false) { const tone = spicyMode ? "매운맛 모드입니다. overview와 reasoning에는 진술 속 구체적 행동을 꼬집는 직설적이고 재치 있는 한국어를 쓰세요. '씨발', '존나', '개판', '빡친다'처럼 강한 표현은 한두 번만 자연스럽게 사용할 수 있지만, 사람 자체를 모욕하는 고정 욕설이나 같은 문구 반복은 금지합니다. 매운맛이더라도 결국 왜 그 쪽이 더 잘못했는지가 선명해야 합니다." : ""; return this.ask(`${context}\n\n양측 진술만 근거로 짧고 분명한 결론을 작성하세요. 제공되지 않은 사실은 만들지 말고, 일반적인 관계 조언·인물 성격 해석·인사말은 금지합니다. overview 첫 문장은 반드시 '더 큰 잘못은 신청인/상대방에게 있습니다.'로 시작하고, 이어서 진술에 나온 구체적 행동 때문에 그런지 적으세요. reasoning은 그 판단의 직접 근거 한두 문장만 쓰세요. 책임지표는 반드시 1~99의 정수이며 50은 금지입니다. 진술에서 더 직접적으로 약속을 어기거나, 무시하거나, 모욕하거나, 일방적으로 행동한 쪽을 더 크게 잡으세요. 극단적인 경우 1:99도 사용할 수 있습니다. claims·facts·advice·clerkComment는 짧게 채우되 화면에는 표시되지 않을 수 있습니다. ${tone}\nSchema: {"overview":"","agreedFacts":[],"complainantClaims":[],"respondentClaims":[],"disputedFacts":[],"unknownFacts":[],"complainantResponsibility":49,"respondentResponsibility":51,"reasoning":"","mediationAdvice":"","clerkComment":"","changedReason":""}`, decisionSchema); }
}

function applySpicyTone(result: DecisionResult): DecisionResult {
  const source = `${result.overview}${result.reasoning}`;
  const index = [...source].reduce((total, character) => total + character.charCodeAt(0), 0) % 3;
  const openings = [
    "씨발, 이건 감정 문제가 아니라 기본을 안 지킨 쪽이 일을 개판 낸 겁니다.",
    "존나 답답하지만, 말만 번지르르하고 행동은 반대로 한 쪽이 더 크게 책임져야 합니다.",
    "빡치게 굴어놓고 상대 반응만 문제 삼으면 그건 너무 얄팍합니다.",
    "이걸 단순한 오해라고 뭉개기엔 실제 행동이 선을 너무 넘었습니다.",
    "사과 한마디로 덮을 일이 아니라, 누가 먼저 일을 꼬아 놓았는지 봐야 합니다.",
    "이번 판은 누가 더 크게 잘못했는지 꽤 명확합니다. 괜히 물타기할 일이 아닙니다.",
  ];
  const closings = [
    "이걸 또 뭉개면 관계는 더 개판 납니다.",
    "억울함부터 말하기 전에 문제된 행동부터 인정하는 게 순서입니다.",
    "감정 탓으로 넘기기엔 실제로 한 행동이 너무 선명합니다.",
    "다음에도 같은 식이면 사과가 아니라 변명으로 들릴 수밖에 없습니다.",
    "상대를 긁어 놓고 반응만 탓하는 건 존나 공평하지 않습니다.",
    "핵심은 말싸움이 아니라, 결국 누가 행동으로 신뢰를 깼느냐입니다.",
  ];

  return {
    ...result,
    overview: `${openings[index]} ${result.overview}`,
    reasoning: `${result.reasoning} ${closings[index]}`,
    mediationAdvice: result.mediationAdvice ? `${result.mediationAdvice} ${closings[(index + 1) % 3]}` : closings[(index + 1) % 3],
    changedReason: result.changedReason ? `${result.changedReason} ${closings[index]}` : result.changedReason,
  };
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
