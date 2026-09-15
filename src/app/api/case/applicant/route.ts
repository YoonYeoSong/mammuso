import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { getCaseRepository } from "@/lib/cases/repository";
import { apiError } from "@/lib/http";
import { classifySafety } from "@/lib/safety";
const schema = z.object({ token: z.string().min(30), answers: z.record(z.string().max(1500)) });
export async function POST(request: NextRequest) { try { const { token, answers } = schema.parse(await request.json()); const repo = getCaseRepository(); const item = await repo.getByApplicantToken(token); if (!item) throw new Error("CASE_NOT_FOUND"); if (classifySafety(Object.values(answers).join(" ")) === "urgent") return NextResponse.json({ case: await repo.markApplicantSafety(token, answers) }); const ai = getAIProvider(); const result = await ai.generatePreliminaryOpinion({ statement: item.complainantStatement, answers }); const respondentQuestions = await ai.generateFollowUpQuestions({ statement: item.complainantStatement, relationshipType: item.relationshipType, party: "respondent" }); return NextResponse.json({ case: await repo.saveApplicantReview(token, answers, result, respondentQuestions) }); } catch (error) { return apiError(error); } }
