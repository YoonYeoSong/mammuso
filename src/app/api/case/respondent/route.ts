import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { getCaseRepository } from "@/lib/cases/repository";
import { apiError } from "@/lib/http";
import { classifySafety } from "@/lib/safety";
const policyVersion = "2026-09-15";
const schema = z.object({ token: z.string().min(30), statement: z.string().min(20).max(5000), answers: z.record(z.string().max(1500)), privacyPolicyAgreed: z.literal(true), aiProcessingAgreed: z.literal(true) });
export async function POST(request: NextRequest) { try { const { token, statement, answers } = schema.parse(await request.json()); const repo = getCaseRepository(); const item = await repo.getByRespondentToken(token); if (!item) throw new Error("CASE_NOT_FOUND"); if (classifySafety(`${statement} ${Object.values(answers).join(" ")}`) === "urgent") return NextResponse.json({ case: await repo.markRespondentSafety(token, statement, answers) }); const result = await getAIProvider().generateJointDecision({ applicantStatement: item.complainantStatement, applicantAnswers: item.complainantAnswers, respondentStatement: statement, respondentAnswers: answers }); return NextResponse.json({ case: await repo.saveRespondentStatement(token, statement, answers, result, policyVersion) }); } catch (error) { return apiError(error); } }
