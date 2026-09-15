import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { getCaseRepository } from "@/lib/cases/repository";
import { createAccessToken, createPublicCaseNumber, hashToken } from "@/lib/security";
import { classifySafety } from "@/lib/safety";
import { apiError } from "@/lib/http";

const inputSchema = z.object({ relationshipType: z.enum(["연인/썸", "친구", "가족", "직장", "기타"]), statement: z.string().min(20).max(5000) });

export async function POST(request: NextRequest) {
  try {
    const input = inputSchema.parse(await request.json());
    const safetyLevel = classifySafety(input.statement);
    const [questions, issues] = safetyLevel === "urgent"
      ? [[], []]
      : [
        await getAIProvider().generateFollowUpQuestions({ statement: input.statement, relationshipType: input.relationshipType, party: "applicant" }),
        await getAIProvider().extractNeutralIssues(input.statement),
      ];
    const token = createAccessToken();
    const caseItem = await getCaseRepository().createCase({ publicCaseNumber: createPublicCaseNumber(), relationshipType: input.relationshipType, complainantStatement: input.statement, applicantTokenHash: hashToken(token), applicantQuestions: questions, neutralIssues: issues, safetyLevel });
    return NextResponse.json({ case: caseItem, applicantToken: token }, { status: 201 });
  } catch (error) { return apiError(error); }
}
