import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { getCaseRepository } from "@/lib/cases/repository";
import { apiError } from "@/lib/http";
const schema = z.object({ token: z.string().min(30), appealText: z.string().min(10).max(3000) });
export async function POST(request: NextRequest) { try { const { token, appealText } = schema.parse(await request.json()); const repo = getCaseRepository(); const item = await repo.getByApplicantToken(token); if (!item) throw new Error("CASE_NOT_FOUND"); if (!item.finalResult || !item.respondentStatement) return NextResponse.json({ message: "양측 진술이 완료된 사건만 이의신청할 수 있습니다." }, { status: 409 }); const result = await getAIProvider().generateAppealDecision({ applicantStatement: item.complainantStatement, applicantAnswers: item.complainantAnswers, respondentStatement: item.respondentStatement, respondentAnswers: item.respondentAnswers, previousResult: item.finalResult, appealText }); return NextResponse.json({ case: await repo.saveAppeal(token, appealText, result) }); } catch (error) { return apiError(error); } }
