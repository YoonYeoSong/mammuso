import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { getCaseRepository } from "@/lib/cases/repository";
import { createAccessToken, createPublicCaseNumber, hashToken } from "@/lib/security";
import { classifySafety } from "@/lib/safety";
import { apiError } from "@/lib/http";
import { assertNoSensitiveIdentifier } from "@/lib/sensitive-data";

const policyVersion = "2026-09-15";
const inputSchema = z.object({ relationshipType: z.enum(["연인/썸", "친구", "가족", "직장", "기타"]), statement: z.string().min(20).max(5000), privacyPolicyAgreed: z.literal(true), aiProcessingAgreed: z.literal(true) });

export async function POST(request: NextRequest) {
  try {
    const input = inputSchema.parse(await request.json());
    assertNoSensitiveIdentifier([input.statement]);
    const safetyLevel = classifySafety(input.statement);
    const [notice, preliminaryResult] = safetyLevel === "urgent"
      ? [{ summary: "안전 관련 표현이 감지되어 일반 조정 절차를 진행하지 않습니다.", issues: [] }, null]
      : await Promise.all([
        getAIProvider().generateRespondentNotice(input.statement),
        getAIProvider().generatePreliminaryOpinion({ statement: input.statement, answers: {} }),
      ]);
    const token = createAccessToken();
    const caseItem = await getCaseRepository().createCase({ publicCaseNumber: createPublicCaseNumber(), relationshipType: input.relationshipType, complainantStatement: input.statement, applicantTokenHash: hashToken(token), applicantQuestions: [], neutralSummary: notice.summary, neutralIssues: notice.issues, preliminaryResult, safetyLevel, policyVersion });
    return NextResponse.json({ case: caseItem, applicantToken: token }, { status: 201 });
  } catch (error) { return apiError(error); }
}
